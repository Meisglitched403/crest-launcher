import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  RefreshCw,
  Folder,
  Boxes,
  Search,
  Trash2,
  Download,
  Loader2,
  ChevronRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ViewHeader,
  SectionRow,
  PrimaryButton,
  GhostButton,
  IconButton,
} from "@/components/launcher/parts";
import type { ModpacksHook } from "../lib/types";
import type { ModResult } from "@/lib/tauri-commands";
import {
  listMods,
  untrackedMods,
  adoptMod,
  searchMods,
  removeMod,
  toggleMod,
  installMod,
} from "@/lib/tauri-commands";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://127.0.0.1:8765/api";

type SearchResult = {
  slug: string;
  title: string;
  author: string;
  description: string;
  downloads: number;
  follows: number;
  icon_url?: string;
  categories: string[];
  versions: string[];
};

const BROWSE_SECTIONS = [
  { id: "popular" as const, label: "Popular", categories: "" },
  { id: "pvp" as const, label: "PvP", categories: "pvp" },
  { id: "optimization" as const, label: "Optimization", categories: "optimization" },
  { id: "utility" as const, label: "Utility", categories: "utility" },
  { id: "magic" as const, label: "Magic", categories: "magic" },
  { id: "combat" as const, label: "Combat", categories: "combat" },
];

export function ModsView({ modpacks }: { modpacks: ModpacksHook }) {
  const active = modpacks.activeModpack;
  const [modsTab, setModsTab] = useState<"installed" | "browse">("installed");
  const prevActiveId = useRef(modpacks.activeId);
  if (prevActiveId.current !== modpacks.activeId) {
    prevActiveId.current = modpacks.activeId;
    setModsTab("installed");
  }
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [installedMods, setInstalledMods] = useState<ModResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [installing, setInstalling] = useState<string | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [modIcons, setModIcons] = useState<Record<string, string>>({});
  const [untracked, setUntracked] = useState<{ filename: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [browseSection, setBrowseSection] =
    useState<
      "popular" | "pvp" | "optimization" | "utility" | "magic" | "combat" | "search"
    >("popular");

  const doBrowseFetch = useCallback(
    async (section: typeof browseSection) => {
      if (section === "search") return;
      const cfg = BROWSE_SECTIONS.find((s) => s.id === section);
      if (!cfg) return;
      setSearching(true);
      setSearchResults([]);
      try {
        const results = await searchMods(
          "",
          active?.mcVersion,
          "fabric",
          20,
          cfg.categories || undefined,
        );
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    },
    [active?.mcVersion, browseSection],
  );

  const prevSection = useRef(browseSection);
  useEffect(() => {
    if (modsTab === "browse" && browseSection !== "search") {
      if (prevSection.current !== browseSection || searchResults.length === 0) {
        doBrowseFetch(browseSection);
      }
    }
    prevSection.current = browseSection;
  }, [modsTab, browseSection, doBrowseFetch, searchResults.length]);

  const loadMods = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    try {
      const [installed, ut] = await Promise.all([
        listMods(active.name),
        untrackedMods(active.name),
      ]);
      setInstalledMods(installed);
      setUntracked(ut);
    } catch {
      // silently
    }
    setLoading(false);
  }, [active]);

  useEffect(() => {
    loadMods();
  }, [loadMods]);

  useEffect(() => {
    for (const m of installedMods) {
      if (modIcons[m.slug]) continue;
      fetch(`${API_BASE}/icon?project=${m.slug}`)
        .then((r) => r.json())
        .then((d: { icon_url?: string }) => {
          if (d.icon_url)
            setModIcons((prev) => ({ ...prev, [m.slug]: d.icon_url! }));
        })
        .catch(() => {});
    }
  }, [installedMods, modIcons]);

  const isInstalled = (slug: string) =>
    installedMods.some((m) => m.slug === slug);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchMods(q, active?.mcVersion, "fabric", 20);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  }, [active?.mcVersion]);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const handleInstall = async (slug: string) => {
    if (!active) return;
    setInstalling(slug);
    try {
      await installMod(active.name, slug, active.mcVersion, active.loaderType);
      const updated = await listMods(active.name);
      setInstalledMods(updated);
    } catch {
      // silently
    }
    setInstalling(null);
  };

  const handleRemove = async (slug: string) => {
    if (!active) return;
    try {
      await removeMod(active.name, slug);
      const updated = await listMods(active.name);
      setInstalledMods(updated);
    } catch {
      // silently
    }
  };

  const handleToggle = async (slug: string) => {
    if (!active) return;
    try {
      const m = installedMods.find((x) => x.slug === slug);
      if (m) {
        await toggleMod(active.name, slug, !m.enabled);
        const updated = await listMods(active.name);
        setInstalledMods(updated);
      }
    } catch {
      // silently
    }
  };

  const modpackBadge = (loader?: string) => {
    if (loader === "fabric") return "text-violet-400";
    return "text-sky-400";
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Mods & Add-ons"
        subtitle={
          active ? `Mods for ${active.name}` : "Select a modpack to manage mods."
        }
        action={
          active ? (
            <div className="flex items-center gap-2">
              <GhostButton
                onClick={loadMods}
                disabled={loading}
                icon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />}
              >
                Reload
              </GhostButton>
              <div className="relative">
                <GhostButton
                  onClick={() => setSelectorOpen(!selectorOpen)}
                  className={`${selectorOpen ? "ring-2 ring-primary" : ""}`}
                  icon={
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg gradient-primary">
                      <Boxes className="h-4 w-4 text-primary-foreground" />
                    </div>
                  }
                >
                  <div className="min-w-0 text-left">
                    <div className="truncate text-xs font-semibold leading-tight">
                      {active.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {active.mcVersion} ·{" "}
                      <span className={modpackBadge(active.loaderType)}>
                        {active.loaderType === "fabric" ? "Fabric" : "Vanilla"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </GhostButton>
                <AnimatePresence>
                  {selectorOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      className="glass-strong absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl shadow-xl"
                    >
                      <div className="max-h-64 overflow-y-auto p-1.5">
                        {modpacks.modpacks.map((mp) => {
                          const isActive = mp.id === modpacks.activeId;
                          return (
                            <button
                              key={mp.id}
                              onClick={() => {
                                modpacks.selectModpack(mp.id);
                                setSelectorOpen(false);
                              }}
                              className={cn(
                                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                                isActive
                                  ? "bg-primary/15 ring-1 ring-primary/30"
                                  : "hover:bg-white/5",
                              )}
                            >
                              <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg gradient-primary">
                                <Boxes className="h-4 w-4 text-primary-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="truncate text-xs font-semibold">
                                  {mp.name}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  {mp.mcVersion} · {mp.loaderType === "fabric" ? "Fabric" : "Vanilla"}
                                </div>
                              </div>
                              {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <GhostButton
                onClick={() =>
                  active &&
                  import("@/lib/tauri-commands").then((m) =>
                    m.openModsFolder(active.name),
                  )
                }
                icon={<Folder className="h-3.5 w-3.5" />}
              >
                Open Folder
              </GhostButton>
            </div>
          ) : undefined
        }
      />

      {!active && (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <Shield className="h-12 w-12 opacity-30" />
          <p className="text-sm">Create or select a modpack on the Home tab first.</p>
        </div>
      )}

      {active && (
        <div className="flex gap-6 items-start">
          {/* Main content */}
          <div className="flex-1 space-y-6">
            {modsTab === "installed" && (
              <>
                {installedMods.length === 0 && untracked.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                    <Shield className="h-10 w-10 opacity-30" />
                    <p className="text-sm">
                      No mods installed yet. Switch to Browse to search Modrinth.
                    </p>
                  </div>
                ) : (
                  <>
                    {installedMods.length > 0 && (
                      <div>
                        <SectionRow
                          label={`Installed (${installedMods.length})`}
                        />
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {installedMods.map((m) => (
                            <motion.div
                              layout
                              key={m.slug}
                              className="glass flex items-center gap-4 rounded-2xl p-4"
                            >
                              {modIcons[m.slug] ? (
                                <img
                                  src={modIcons[m.slug]}
                                  className="h-10 w-10 shrink-0 rounded-xl object-cover"
                                />
                              ) : (
                                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-primary">
                                  <Shield className="h-5 w-5 text-primary-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="truncate text-sm font-semibold">
                                  {m.slug}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  v{m.version_id?.slice(0, 8)}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleToggle(m.slug)}
                                  className={`relative h-5 w-9 rounded-full transition ${m.enabled ? "gradient-primary" : "bg-white/10"}`}
                                >
                                  <motion.div
                                    layout
                                    transition={{
                                      type: "spring",
                                      stiffness: 500,
                                      damping: 30,
                                    }}
                                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow ${m.enabled ? "left-[18px]" : "left-0.5"}`}
                                  />
                                </button>
                                <IconButton
                                  icon={Trash2}
                                  onClick={() => handleRemove(m.slug)}
                                  destructive
                                  title="Remove"
                                />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {untracked.length > 0 && (
                      <div>
                        <SectionRow
                          label={`Manually added (${untracked.length})`}
                          action={
                            <span className="text-[9px] text-muted-foreground/50">
                              — .jar files in mods folder not tracked in profile
                            </span>
                          }
                        />
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {untracked.map((u) => (
                            <div
                              key={u.filename}
                              className="glass flex items-center gap-4 rounded-2xl p-4"
                            >
                              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5">
                                <Shield className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="truncate text-sm font-semibold">
                                  {u.filename}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Manual install
                                </div>
                              </div>
                              <button
                                onClick={async () => {
                                  if (!active) return;
                                  try {
                                    await adoptMod(active.name, u.filename);
                                    loadMods();
                                  } catch {
                                    // silently
                                  }
                                }}
                                className="rounded-lg bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/25"
                              >
                                Adopt
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {modsTab === "browse" && (
              <>
                {/* Section pills */}
                <div className="flex flex-wrap gap-2">
                  {BROWSE_SECTIONS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setBrowseSection(s.id)}
                      className={cn(
                        "rounded-xl px-4 py-2 text-sm font-medium transition",
                        browseSection === s.id
                          ? "gradient-primary text-primary-foreground shadow"
                          : "glass text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      setBrowseSection("search")
                    }
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition",
                      browseSection === "search"
                        ? "gradient-primary text-primary-foreground shadow"
                        : "glass text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Search className="h-4 w-4" /> Search
                  </button>
                </div>

                {browseSection === "search" && (
                  <div className="glass flex items-center gap-2 rounded-2xl px-4 py-3">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={`Search Modrinth for ${active?.mcVersion ?? ""} Fabric mods…`}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                    {searching && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                  </div>
                )}

                {/* Empty / loading states */}
                {searching && searchResults.length === 0 && (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!searching &&
                  searchResults.length === 0 &&
                  browseSection === "search" &&
                  !query.trim() && (
                    <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                      <Search className="h-10 w-10 opacity-30" />
                      <p className="text-sm">Type a query to search Modrinth.</p>
                    </div>
                  )}
                {!searching &&
                  searchResults.length === 0 &&
                  browseSection === "search" &&
                  query.trim() && (
                    <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                      <Search className="h-10 w-10 opacity-30" />
                      <p className="text-sm">
                        No results found for "{query}".
                      </p>
                    </div>
                  )}
                {!searching &&
                  searchResults.length === 0 &&
                  browseSection !== "search" && (
                    <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                      <Shield className="h-10 w-10 opacity-30" />
                      <p className="text-sm">No mods found in this category.</p>
                    </div>
                  )}

                {/* Results grid */}
                {searchResults.length > 0 && (
                  <div>
                    <SectionRow label={browseSection === "search" ? `Results for "${query}"` : BROWSE_SECTIONS.find((s) => s.id === browseSection)?.label ?? "Mods"} />
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {searchResults.map((m) => {
                        const installed = isInstalled(m.slug);
                        return (
                          <motion.div
                            key={m.slug}
                            layout
                            whileHover={{ y: -2 }}
                            className="glass group relative overflow-hidden rounded-2xl p-4"
                          >
                            <div className="flex items-start gap-4">
                              {m.icon_url ? (
                                <img
                                  src={m.icon_url}
                                  className="h-12 w-12 shrink-0 rounded-xl object-cover"
                                />
                              ) : (
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl gradient-primary">
                                  <Shield className="h-6 w-6 text-primary-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div>
                                  <div className="font-display text-base font-semibold truncate">
                                    {m.title}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {m.author} ·{" "}
                                    {m.downloads?.toLocaleString()}{" "}
                                    downloads
                                  </div>
                                </div>
                                <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                                  {m.description}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {(m.categories || []).slice(0, 3).map((t: string) => (
                                    <span
                                      key={t}
                                      className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground"
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                                <div className="mt-3">
                                  {installed ? (
                                    <button
                                      onClick={() => handleRemove(m.slug)}
                                      className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20"
                                    >
                                      <Trash2 className="h-3 w-3" /> Remove
                                    </button>
                                  ) : (
                                    <PrimaryButton
                                      onClick={() => handleInstall(m.slug)}
                                      disabled={installing === m.slug}
                                    >
                                      {installing === m.slug ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Download className="h-3 w-3" />
                                      )}
                                      {installing === m.slug ? "Installing…" : "Install"}
                                    </PrimaryButton>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Tabs rail */}
          <div className="glass flex shrink-0 flex-col gap-1 rounded-2xl p-1">
            <button
              onClick={() => setModsTab("installed")}
              className={cn(
                "rounded-xl px-4 py-2.5 text-sm font-medium transition",
                modsTab === "installed"
                  ? "gradient-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Installed
              {installedMods.length > 0
                ? ` (${installedMods.length})`
                : ""}
            </button>
            <button
              onClick={() => setModsTab("browse")}
              className={cn(
                "rounded-xl px-4 py-2.5 text-sm font-medium transition",
                modsTab === "browse"
                  ? "gradient-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Browse
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
