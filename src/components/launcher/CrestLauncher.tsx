import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Play,
  Search,
  Bell,
  ChevronDown,
  Cpu,
  HardDrive,
  Wifi,
  Zap,
  Download,
  Check,
  Users,
  Shield,
  Sparkles,
  Server as ServerIcon,
  Package as PackageIcon,
  Star,
  ExternalLink,
  Folder,
  Volume2,
  Monitor,
  Keyboard,
  X,
  Plus,
  LogOut,
  Boxes,
  Copy,
  Trash2,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  FileText,
  Terminal,
  UserPlus,
  Loader2,
} from "lucide-react";
import logo from "@/assets/logo.png";

import news1 from "@/assets/news-1.jpg";
import news2 from "@/assets/news-2.jpg";
import news3 from "@/assets/news-3.jpg";
import {
  navItems,
  servers,
  friends,
  cosmetics,
  rarityColor,
  crashLogs,
  type NavId,
  type CrashEntry,
  type LiveVersion,
} from "./data";
import { ThemeProvider, ThemeTrigger } from "./ThemeCustomizer";
import {
  fetchVanillaVersions,
  fetchFabricVersions,
  fetchNeoForgeVersions,
  type LoaderType,
} from "@/lib/minecraft-api";
import {
  useOfflineProfiles,
  type OfflineProfile,
} from "@/hooks/use-offline-profiles";
import { useModpacks } from "@/hooks/use-modpacks";
import {
  installVersion,
  launchGame,
  ensureJava,
  getInstalledVersions,
  isInstalled,
  searchMods,
  installMod,
  removeMod,
  listMods,
  toggleMod,
  type InstalledVersion,
  type ModResult,
} from "@/lib/tauri-commands";

export function CrestLauncher() {
  return (
    <ThemeProvider>
      <CrestLauncherInner />
    </ThemeProvider>
  );
}

function CrestLauncherInner() {
  const [active, setActive] = useState<NavId>("home");
  const profiles = useOfflineProfiles();
  const modpacks = useModpacks();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Ambient background orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,theme(colors.violet.500/0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,theme(colors.cyan.400/0.14),transparent_55%)]" />
        <div className="absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl animate-float-orb" />
        <div
          className="absolute -right-40 bottom-0 h-[28rem] w-[28rem] rounded-full bg-cyan-500/20 blur-3xl animate-float-orb"
          style={{ animationDelay: "3s" }}
        />
      </div>

      <div className="flex min-h-screen">
        <Sidebar active={active} setActive={setActive} />
        <div className="flex min-h-screen flex-1 flex-col">
          <TopBar profiles={profiles} modpacks={modpacks} />
          <main className="flex-1 px-8 pb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                {active === "home" && <HomeView profiles={profiles} modpacks={modpacks} />}
                {active === "versions" && <VersionsView modpacks={modpacks} />}
                {active === "modpacks" && <ModpacksView modpacks={modpacks} />}
                {active === "mods" && <ModsView modpacks={modpacks} />}
                {active === "servers" && <ServersView />}
                {active === "cosmetics" && <CosmeticsView />}
                {active === "performance" && <PerformanceView />}
                {active === "crashes" && <CrashLogsView />}
                {active === "friends" && <FriendsView />}
                {active === "news" && <NewsView />}
                {active === "stats" && <StatsView />}
                {active === "settings" && <SettingsView profiles={profiles} />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Layout ------------------------------- */

function Sidebar({
  active,
  setActive,
}: {
  active: NavId;
  setActive: (id: NavId) => void;
}) {
  return (
    <aside className="glass-strong sticky top-0 flex h-screen w-64 shrink-0 flex-col gap-2 p-5">
      <div className="mb-4 flex items-center gap-3">
        <img
          src={logo}
          alt="Crest Client"
          className="h-11 w-11 drop-shadow-[0_0_18px_rgba(168,85,247,0.55)]"
        />
        <div>
          <div className="font-display text-lg font-semibold leading-tight">
            Crest Client
          </div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
            v3.2.0 · Stable
          </div>
        </div>
      </div>

      <nav className="mt-2 flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-white/5 hover:text-foreground"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl gradient-primary opacity-95 shadow-[0_10px_30px_-10px_rgba(168,85,247,0.6)]"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                />
              )}
              <Icon
                className={`relative z-10 h-4 w-4 ${isActive ? "text-primary-foreground" : ""}`}
              />
              <span
                className={`relative z-10 ${isActive ? "text-primary-foreground" : ""}`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="glass rounded-2xl p-3">
          <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-widest text-muted-foreground">
            <span>System</span>
            <span className="text-emerald-400">Optimal</span>
          </div>
          <StatBar icon={Cpu} label="CPU" value={22} />
          <StatBar icon={HardDrive} label="RAM" value={41} />
          <StatBar icon={Wifi} label="Net" value={12} />
        </div>
      </div>
    </aside>
  );
}

function StatBar({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: number;
}) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3 w-3" />
          {label}
        </span>
        <span className="tabular-nums text-foreground/80">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full gradient-primary"
        />
      </div>
    </div>
  );
}

const FALLBACK_VERSIONS: LiveVersion[] = [
  { id: "26.2", type: "Release", loaderType: "vanilla", releaseTime: "", stable: true },
  { id: "26.1.2", type: "Release", loaderType: "vanilla", releaseTime: "", stable: true },
  { id: "26.1.1", type: "Release", loaderType: "vanilla", releaseTime: "", stable: true },
  { id: "26.1", type: "Release", loaderType: "vanilla", releaseTime: "", stable: true },
  { id: "1.21.11", type: "Release", loaderType: "vanilla", releaseTime: "", stable: true },
  { id: "1.21.5", type: "Release", loaderType: "vanilla", releaseTime: "", stable: true },
  { id: "1.21.4", type: "Release", loaderType: "vanilla", releaseTime: "", stable: true },
  { id: "1.20.6", type: "Release", loaderType: "vanilla", releaseTime: "", stable: true },
  { id: "1.20.1", type: "Release", loaderType: "vanilla", releaseTime: "", stable: true },
  { id: "1.19.4", type: "Release", loaderType: "vanilla", releaseTime: "", stable: true },
  { id: "1.16.5", type: "Release", loaderType: "vanilla", releaseTime: "", stable: true },
];

function useVersionData() {
  const vanilla = useQuery({
    queryKey: ["versions", "vanilla"],
    queryFn: () => fetchVanillaVersions(),
    staleTime: 300_000,
  });
  const fabric = useQuery({
    queryKey: ["versions", "fabric"],
    queryFn: () => fetchFabricVersions(),
    staleTime: 300_000,
  });
  const neoforge = useQuery({
    queryKey: ["versions", "neoforge"],
    queryFn: () => fetchNeoForgeVersions(),
    staleTime: 300_000,
  });

  const vanillaData = vanilla.data ?? FALLBACK_VERSIONS;

  const all: LiveVersion[] = [
    ...vanillaData,
    ...(fabric.data ?? []),
    ...(neoforge.data ?? []),
  ];

  const loading = vanilla.isLoading || fabric.isLoading || neoforge.isLoading;
  const error = vanilla.error || fabric.error || neoforge.error;

  return { versions: all, loading, error, vanilla, fabric, neoforge };
}

function TopBar({
  profiles,
  modpacks,
}: {
  profiles: ReturnType<typeof useOfflineProfiles>;
  modpacks: ReturnType<typeof useModpacks>;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");

  const initials = (name: string) => name.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 px-8 py-5">
      <div className="glass flex flex-1 items-center gap-2 rounded-full px-4 py-2.5">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Search mods, servers, versions, friends…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </div>
      <ThemeTrigger />
      <button className="glass rounded-full p-2.5 transition hover:bg-white/10">
        <Bell className="h-4 w-4" />
      </button>

      {/* Modpack indicator */}
      {modpacks.activeModpack && (
        <div className="glass flex items-center gap-2 rounded-full px-3 py-2 text-xs">
          <Boxes className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium">{modpacks.activeModpack.name}</span>
          <span className="text-[10px] text-muted-foreground">
            {modpacks.activeModpack.mcVersion} · {modpacks.activeModpack.loaderType}
          </span>
        </div>
      )}

      {/* Profile selector */}
      <div className="relative">
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="glass flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-3"
        >
          <div className="grid h-8 w-8 place-items-center rounded-full gradient-primary text-xs font-bold text-primary-foreground">
            {profiles.activeProfile
              ? initials(profiles.activeProfile.username)
              : "??"}
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold leading-tight">
              {profiles.activeProfile?.username ?? "No profile"}
            </div>
            <div className="text-[10px] text-emerald-400">Offline · Local</div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>

        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="glass-strong absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-2xl"
            >
              <div className="border-b border-white/5 p-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                  Offline Profiles
                </div>
                <div className="flex gap-1.5">
                  <input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newUsername.trim()) {
                        profiles.addProfile(newUsername.trim());
                        setNewUsername("");
                      }
                    }}
                    placeholder="New username…"
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs outline-none placeholder:text-muted-foreground"
                  />
                  <button
                    onClick={() => {
                      if (newUsername.trim()) {
                        profiles.addProfile(newUsername.trim());
                        setNewUsername("");
                      }
                    }}
                    className="rounded-lg gradient-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {profiles.profiles.length === 0 && (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    No profiles yet — type a username above
                  </div>
                )}
                {profiles.profiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      profiles.selectProfile(p.id);
                      setProfileOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 transition hover:bg-white/5 ${p.id === profiles.activeId ? "bg-white/[0.06]" : ""}`}
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full gradient-primary text-[10px] font-bold text-primary-foreground">
                      {initials(p.username)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-xs font-semibold">{p.username}</div>
                      <div className="text-[10px] text-muted-foreground">
                        Last used {new Date(p.lastUsed).toLocaleDateString()}
                      </div>
                    </div>
                    {p.id === profiles.activeId && (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        profiles.removeProfile(p.id);
                      }}
                      className="rounded p-1 text-muted-foreground hover:bg-white/10 hover:text-rose-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

/* -------------------------------- Home -------------------------------- */

function HomeView({
  profiles,
  modpacks,
}: {
  profiles: ReturnType<typeof useOfflineProfiles>;
  modpacks: ReturnType<typeof useModpacks>;
}) {
  const { versions, loading: versionsLoading } = useVersionData();
  const [ram, setRam] = useState(8);
  const [launching, setLaunching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [showCreateModpack, setShowCreateModpack] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    let dead = false;
    const check = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8765/api/health");
        if (!dead) setBackendOnline(res.ok);
      } catch {
        if (!dead) setBackendOnline(false);
      }
    };
    check();
    const id = setInterval(check, 5000);
    return () => { dead = true; clearInterval(id); };
  }, []);

  const active = modpacks.activeModpack;
  const badVersion = active && !/^\d+\.\d+(\.\d+)?$/.test(active.mcVersion);

  const handleLaunch = async () => {
    if (launching || !active || !profiles.activeProfile) return;
    if (badVersion) return;
    setLaunching(true);
    setProgress(0);
    setLaunchError(null);

    try {
      setProgress(10);
      await ensureJava();
      setProgress(40);
      // installVersion returns the actual version ID (for Fabric: fabric-loader-{ver}-{mc})
      const installedId = await installVersion(active.mcVersion, active.loaderType);
      setProgress(80);
      await launchGame(installedId, profiles.activeProfile.username, ram * 1024, active.name);
      setProgress(100);
      setTimeout(() => setLaunching(false), 600);
    } catch (err) {
      if (err instanceof TypeError && (err.message === "Failed to fetch" || err.message.includes("fetch"))) {
        setLaunchError("Backend server not reachable on port 8765");
      } else {
        setLaunchError(String(err));
      }
      setLaunching(false);
    }
  };

  return (
    <>
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-3xl flex-col justify-center py-10">
      {/* Session chip */}
      <div className="mb-10 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-muted-foreground">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          Signed in as{" "}
          <span className="text-foreground">
            {profiles.activeProfile?.username ?? "Unknown"}
          </span>
          <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px]">
            OFFLINE
          </span>
        </div>
        <div className="hidden items-center gap-4 text-[11px] text-muted-foreground sm:flex">
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${backendOnline ? "bg-emerald-400" : "bg-rose-400"}`} />
            {backendOnline ? "API" : "API off"}
          </span>
          <span>
            Java <span className="font-mono text-foreground/80">21</span>
          </span>
        </div>
      </div>

      {/* Wordmark */}
      <div className="text-center">
        <div className="text-[11px] font-medium uppercase tracking-[0.4em] text-muted-foreground">
          Crest Client · v3.2.0
        </div>
        <h1 className="mt-4 font-display text-6xl font-semibold leading-[0.95] tracking-tight sm:text-7xl">
          Ready when <span className="text-gradient">you are</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          {active
            ? `Playing ${active.name} — ${active.mcVersion} ${active.loaderType}`
            : "Create a modpack to get started."}
        </p>
      </div>

      {/* Modpack cards + launch */}
      <div className="mt-10">
        {/* Modpack list */}
        {modpacks.modpacks.length === 0 ? (
          <div className="mx-auto max-w-md text-center">
            <div className="glass rounded-2xl p-8">
              <Boxes className="mx-auto mb-4 h-10 w-10 text-primary" />
              <div className="font-display text-lg font-semibold">No modpacks yet</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first modpack to pick a Minecraft version and modloader.
              </p>
              <button
                onClick={() => setShowCreateModpack(true)}
                className="mx-auto mt-4 flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:scale-105"
              >
                <Plus className="h-4 w-4" /> Create Modpack
              </button>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Modpacks</div>
              <button
                onClick={() => setShowCreateModpack(true)}
                className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium transition hover:bg-white/10"
              >
                <Plus className="h-3 w-3" /> New
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {modpacks.modpacks.map((mp) => (
                <button
                  key={mp.id}
                  onClick={() => modpacks.selectModpack(mp.id)}
                  className={`glass flex items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                    mp.id === active?.id
                      ? "ring-2 ring-primary shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                      : "hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg gradient-primary">
                    <Boxes className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{mp.name}</div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span>{mp.mcVersion}</span>
                      <span>·</span>
                      <span className={mp.loaderType === "fabric" ? "text-violet-400" : "text-sky-400"}>
                        {mp.loaderType === "fabric" ? "Fabric" : "Vanilla"}
                      </span>
                    </div>
                  </div>
                  {mp.id === active?.id && (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Launch button */}
        {active && (
          <>
            <button
              onClick={handleLaunch}
              disabled={launching || !profiles.activeProfile}
              className="group relative mx-auto mt-8 flex h-20 w-20 items-center justify-center rounded-full gradient-primary text-primary-foreground shadow-[var(--shadow-glow)] transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Launch game"
            >
              <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/20" />
              {!launching && (
                <span className="pointer-events-none absolute inset-0 rounded-full animate-pulse-ring border border-primary/50" />
              )}
              {launching ? (
                <span className="font-mono text-xs font-semibold">{progress}%</span>
              ) : (
                <Play className="h-7 w-7 fill-current" />
              )}
            </button>

            {!profiles.activeProfile && (
              <p className="mx-auto mt-4 max-w-xs text-center text-xs text-muted-foreground">
                Create or select an offline profile to launch
              </p>
            )}

            {badVersion && (
              <div className="mx-auto mt-4 max-w-md text-center">
                <p className="text-xs text-rose-300">
                  Bad MC version &quot;{active?.mcVersion}&quot; — cannot
                  launch. Remove this modpack and create a new one.
                </p>
                <button
                  onClick={() => modpacks.removeModpack(active!.id)}
                  className="mt-2 rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/30"
                >
                  Remove modpack
                </button>
              </div>
            )}
            {launchError && (
              <p className="mx-auto mt-4 max-w-md text-center text-xs text-rose-300">
                {launchError}
              </p>
            )}

            {launching && (
              <div className="mx-auto mt-6 h-0.5 w-64 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "linear", duration: 0.06 }}
                  className="h-full gradient-primary"
                />
              </div>
            )}

            {/* RAM slider */}
            <div className="mx-auto mt-8 flex max-w-sm items-center gap-3 rounded-2xl glass px-4 py-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/5">
                <HardDrive className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span>RAM</span>
                  <span className="font-mono text-foreground/80">{ram} GB</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={16}
                  value={ram}
                  onChange={(e) => setRam(Number(e.target.value))}
                  className="mt-1 w-full accent-[color:var(--primary)]"
                />
              </div>
            </div>
          </>
        )}

        <div className="mt-4 text-center text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" /> Fabric · Sodium · Iris
            pre-tuned
          </span>
        </div>
      </div>
    </div>

    {/* Create Modpack Modal */}
    {showCreateModpack && (
      <CreateModpackModal
        versions={versions}
        versionsLoading={versionsLoading}
        onClose={() => setShowCreateModpack(false)}
        onCreateModpack={(name, mcVersion, loaderType) => {
          const result = modpacks.addModpack(name, mcVersion, loaderType);
          if (result) setShowCreateModpack(false);
        }}
      />
    )}
    </>
  );
}

/* -------------------------- Create Modpack Modal -------------------------- */

function CreateModpackModal({
  versions,
  versionsLoading,
  onClose,
  onCreateModpack,
}: {
  versions: LiveVersion[];
  versionsLoading: boolean;
  onClose: () => void;
  onCreateModpack: (name: string, mcVersion: string, loaderType: "vanilla" | "fabric") => void;
}) {
  const [name, setName] = useState("");
  const [mcVersion, setMcVersion] = useState("");
  const [loaderType, setLoaderType] = useState<"vanilla" | "fabric">("fabric");

  const vanillaVersions = versions.filter((v) => v.loaderType === "vanilla" && v.type === "Release");

  const handleCreate = () => {
    if (!name.trim() || !mcVersion) return;
    onCreateModpack(name.trim(), mcVersion, loaderType);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: 0.96 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong w-full max-w-md rounded-3xl p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              New Modpack
            </div>
            <h3 className="font-display text-xl font-semibold">Create Modpack</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Name */}
        <label className="mb-4 block">
          <div className="mb-1.5 text-xs text-muted-foreground">Modpack Name</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Modded World"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50"
            autoFocus
          />
        </label>

        {/* MC Version */}
        <label className="mb-4 block">
          <div className="mb-1.5 text-xs text-muted-foreground">Minecraft Version</div>
          {versionsLoading ? (
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
            </div>
          ) : (
            <select
              value={mcVersion}
              onChange={(e) => setMcVersion(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none"
            >
              <option value="">Select version…</option>
              {vanillaVersions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.id} {v.stable ? "(Latest)" : ""}
                </option>
              ))}
            </select>
          )}
        </label>

        {/* Loader */}
        <div className="mb-5">
          <div className="mb-1.5 text-xs text-muted-foreground">Mod Loader</div>
          <div className="flex gap-2">
            {(["fabric", "vanilla"] as const).map((lt) => (
              <button
                key={lt}
                onClick={() => setLoaderType(lt)}
                className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                  loaderType === lt
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                {lt === "fabric" ? "Fabric" : "Vanilla"}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={!name.trim() || !mcVersion}
          className="w-full rounded-xl gradient-primary py-3 text-sm font-semibold text-primary-foreground transition hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
        >
          Create Modpack
        </button>
        {!name.trim() && (
          <p className="mt-2 text-center text-xs text-muted-foreground">Enter a modpack name first</p>
        )}
        {name.trim() && !mcVersion && (
          <p className="mt-2 text-center text-xs text-muted-foreground">Select a Minecraft version first</p>
        )}
      </motion.div>
    </motion.div>
  );
}

function SectionTitle({ title, action }: { title: string; action?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {action && (
        <button className="text-xs text-muted-foreground hover:text-foreground">
          {action}
        </button>
      )}
    </div>
  );
}

/* ------------------------------ Versions ------------------------------ */

function VersionsView({
  modpacks,
}: {
  modpacks: ReturnType<typeof useModpacks>;
}) {
  const { versions, loading, error } = useVersionData();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("All");
  const filters = [
    "All",
    "Release",
    "Snapshot",
    "Vanilla",
    "Fabric",
    "NeoForge",
  ];
  const shown = versions.filter((v) => {
    if (filter === "All") return true;
    if (filter === "Release" || filter === "Snapshot") return v.type === filter;
    const loaderMap: Record<string, LoaderType> = {
      Vanilla: "vanilla",
      Fabric: "fabric",
      NeoForge: "neoforge",
    };
    return v.loaderType === loaderMap[filter];
  });

  const installMutation = useMutation({
    mutationFn: (v: LiveVersion) => installVersion(v.id, v.loaderType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["installed-versions"] });
    },
  });

  return (
    <div className="space-y-6">
      <Header
        title="Versions"
        subtitle="Install, manage and pin your Minecraft versions. All data fetched live from Mojang, Fabric & NeoForge."
      />

      {loading && (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fetching versions
          from Mojang, Fabric & NeoForge…
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          Failed to fetch versions. Check your connection and try again.
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                  filter === f
                    ? "gradient-primary text-primary-foreground"
                    : "glass hover:bg-white/10"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="glass overflow-hidden rounded-2xl">
            {shown.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No versions match this filter.
              </div>
            )}
            {shown.slice(0, 50).map((v, i) => (
              <div
                key={v.id}
                className={`flex items-center gap-4 px-5 py-4 ${i !== shown.length - 1 ? "border-b border-white/5" : ""} transition hover:bg-white/[0.03]`}
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg gradient-primary">
                  <PackageIcon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{v.id}</span>
                    {v.stable && v.loaderType === "vanilla" && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                        LATEST
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        v.loaderType === "vanilla"
                          ? "bg-sky-500/20 text-sky-300"
                          : v.loaderType === "fabric"
                            ? "bg-violet-500/20 text-violet-300"
                            : v.loaderType === "neoforge"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-slate-500/20 text-slate-300"
                      }`}
                    >
                      {v.loaderType === "neoforge"
                        ? "NeoForge"
                        : v.loaderType.charAt(0).toUpperCase() +
                          v.loaderType.slice(1)}
                    </span>
                    {!v.stable && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-muted-foreground">
                        SNAPSHOT
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {v.type} ·{" "}
                    {v.releaseTime
                      ? new Date(v.releaseTime).toLocaleDateString()
                      : "—"}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      const loaderType = v.loaderType === "vanilla" ? "vanilla" : "fabric";
                      // Extract MC version from any known ID format
                      let mcVersion = v.id;
                      // Fabric: "Fabric 1.21.4 (0.16.9)" → "1.21.4"
                      const fabMatch = v.id.match(/^Fabric\s+([\d.]+)/);
                      if (fabMatch) mcVersion = fabMatch[1];
                      // NeoForge / any "(MC X.Y.Z)" format → extract the MC version
                      const mcMatch = v.id.match(/\(MC\s+([\d.]+)\)/);
                      if (mcMatch) mcVersion = mcMatch[1];
                      modpacks.addModpack(v.id, mcVersion, loaderType);
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-primary/15 px-2.5 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/25"
                    title="Create modpack from this version"
                  >
                    <Boxes className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => installMutation.mutate(v)}
                    disabled={installMutation.isPending}
                    className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium transition hover:bg-white/10 disabled:opacity-50"
                  >
                    {installMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Download className="h-3 w-3" />
                    )}
                    {installMutation.isPending ? "Installing…" : "Install"}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {shown.length > 50 && (
            <div className="text-center text-xs text-muted-foreground">
              Showing 50 of {shown.length} versions
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* -------------------------------- Mods -------------------------------- */

type SearchResult = {
  slug: string;
  title: string;
  author: string;
  description: string;
  downloads: number;
  follows: number;
  categories: string[];
  versions: string[];
};

function ModsView({ modpacks }: { modpacks: ReturnType<typeof useModpacks> }) {
  const active = modpacks.activeModpack;
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [installedMods, setInstalledMods] = useState<ModResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [installing, setInstalling] = useState<string | null>(null);

  useEffect(() => {
    if (active) {
      listMods(active.name).then(setInstalledMods).catch(() => {});
    }
  }, [active]);

  const isInstalled = (slug: string) => installedMods.some((m) => m.slug === slug);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const results = await searchMods(q, active?.mcVersion, "fabric", 20);
      setSearchResults(results);
    } catch { setSearchResults([]); }
    setSearching(false);
  }, [active?.mcVersion]);

  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); return; }
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
    } catch {}
    setInstalling(null);
  };

  const handleRemove = async (slug: string) => {
    if (!active) return;
    try {
      await removeMod(active.name, slug);
      const updated = await listMods(active.name);
      setInstalledMods(updated);
    } catch {}
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
    } catch {}
  };

  return (
    <div className="space-y-6">
      <Header
        title="Mods & Add-ons"
        subtitle={active ? `Mods for ${active.name}` : "Select a modpack to manage mods."}
      />

      {!active && (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <Shield className="h-12 w-12 opacity-30" />
          <p className="text-sm">Create or select a modpack on the Home tab first.</p>
        </div>
      )}

      {active && (
        <>
          {/* Search */}
          <div className="glass flex items-center gap-2 rounded-2xl px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search Modrinth for ${active.mcVersion} Fabric mods…`}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {searching && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>

          {/* Installed mods */}
          {installedMods.length > 0 && (
            <div>
              <div className="mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                Installed ({installedMods.length})
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {installedMods.map((m) => (
                  <div key={m.slug} className="glass flex items-center gap-4 rounded-2xl p-4">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-primary">
                      <Shield className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-semibold">{m.slug}</div>
                      <div className="text-xs text-muted-foreground">v{m.version_id?.slice(0, 8)}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggle(m.slug)}
                        className={`relative h-5 w-9 rounded-full transition ${m.enabled ? "gradient-primary" : "bg-white/10"}`}
                      >
                        <motion.div
                          layout
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow ${m.enabled ? "left-[18px]" : "left-0.5"}`}
                        />
                      </button>
                      <button
                        onClick={() => handleRemove(m.slug)}
                        className="rounded-lg bg-white/5 p-1.5 text-muted-foreground hover:bg-rose-500/20 hover:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search results */}
          {searchResults.length > 0 && (
            <div>
              <div className="mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                Search results
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {searchResults.map((m) => {
                  const installed = isInstalled(m.slug);
                  return (
                    <motion.div
                      key={m.slug}
                      whileHover={{ y: -2 }}
                      className="glass group relative overflow-hidden rounded-2xl p-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl gradient-primary">
                          <Shield className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-display text-base font-semibold truncate">
                                {m.title}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {m.author} · {m.downloads?.toLocaleString()} downloads
                              </div>
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
                              <button
                                onClick={() => handleInstall(m.slug)}
                                disabled={installing === m.slug}
                                className="flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:scale-105 transition disabled:opacity-50"
                              >
                                {installing === m.slug ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Download className="h-3 w-3" />
                                )}
                                Install
                              </button>
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
  );
}

/* ------------------------------ Servers ------------------------------- */

function ServersView() {
  return (
    <div className="space-y-6">
      <Header
        title="Servers"
        subtitle="Your saved servers and one-click featured lobbies."
        action={
          <button className="flex items-center gap-1.5 rounded-full gradient-primary px-4 py-2 text-xs font-medium text-primary-foreground">
            <Plus className="h-3 w-3" /> Add Server
          </button>
        }
      />
      <div className="grid grid-cols-1 gap-4">
        {servers.map((s) => (
          <motion.div
            key={s.name}
            whileHover={{ x: 4 }}
            className="glass flex items-center gap-5 rounded-2xl p-5"
          >
            <div className="grid h-14 w-14 place-items-center rounded-xl gradient-primary">
              <ServerIcon className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-semibold">
                  {s.name}
                </span>
                {s.featured && (
                  <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                    FEATURED
                  </span>
                )}
                {s.warning && (
                  <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                    ANARCHY
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {s.ip} · {s.version}
              </div>
            </div>
            <div className="hidden text-right md:block">
              <div className="text-xs text-muted-foreground">Players</div>
              <div className="font-mono text-sm font-semibold">
                {s.players.toLocaleString()} / {s.max.toLocaleString()}
              </div>
            </div>
            <div className="hidden text-right md:block">
              <div className="text-xs text-muted-foreground">Ping</div>
              <div
                className={`font-mono text-sm font-semibold ${s.ping < 50 ? "text-emerald-400" : s.ping < 80 ? "text-amber-400" : "text-rose-400"}`}
              >
                {s.ping} ms
              </div>
            </div>
            <button className="flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:scale-105">
              <Play className="h-4 w-4 fill-current" /> Join
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- Cosmetics ------------------------------ */

function CosmeticsView() {
  return (
    <div className="space-y-6">
      <Header
        title="Cosmetics Wardrobe"
        subtitle="Wings, capes, pets, emotes and weapon skins."
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {cosmetics.map((c) => (
          <motion.div
            key={c.name}
            whileHover={{ y: -6, scale: 1.02 }}
            className="glass group overflow-hidden rounded-2xl p-4"
          >
            <div
              className={`relative mb-3 aspect-square overflow-hidden rounded-xl bg-gradient-to-br ${rarityColor[c.rarity]}`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.4),transparent_60%)]" />
              <div className="absolute inset-0 grid place-items-center font-display text-5xl font-black text-white/90 drop-shadow-lg">
                {c.name[0]}
              </div>
              {c.equipped && (
                <div className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">
                  EQUIPPED
                </div>
              )}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {c.type}
            </div>
            <div className="truncate font-display font-semibold">{c.name}</div>
            <div
              className={`text-xs font-medium bg-gradient-to-r ${rarityColor[c.rarity]} bg-clip-text text-transparent`}
            >
              {c.rarity}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------- Performance ----------------------------- */

function PerformanceView() {
  const [preset, setPreset] = useState("Balanced");
  const presets = [
    {
      name: "Battery",
      desc: "Cap 60 FPS · Low power · Fans quiet",
      color: "from-emerald-400 to-cyan-500",
    },
    {
      name: "Balanced",
      desc: "Adaptive · Great visuals · Smooth",
      color: "from-cyan-400 to-violet-500",
    },
    {
      name: "Performance",
      desc: "Uncapped FPS · Max threads · Boost",
      color: "from-fuchsia-400 to-rose-500",
    },
    {
      name: "Cinematic",
      desc: "Shaders on · 4K · Ray-traced clouds",
      color: "from-amber-400 to-orange-500",
    },
  ];
  return (
    <div className="space-y-6">
      <Header
        title="Performance"
        subtitle="Tune the launcher and JVM for your rig."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {presets.map((p) => (
          <button
            key={p.name}
            onClick={() => setPreset(p.name)}
            className={`glass group relative overflow-hidden rounded-2xl p-5 text-left transition ${preset === p.name ? "ring-2 ring-primary" : ""}`}
          >
            <div
              className={`absolute inset-0 opacity-20 bg-gradient-to-br ${p.color}`}
            />
            <div className="relative">
              <Zap className="mb-3 h-6 w-6" />
              <div className="font-display text-lg font-semibold">{p.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{p.desc}</div>
              {preset === p.name && (
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
                  <Check className="h-3 w-3" /> Active
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <SectionTitle title="JVM Flags" />
          <pre className="overflow-x-auto rounded-lg border border-white/5 bg-black/40 p-4 text-[11px] leading-relaxed text-cyan-200">
            {`-Xms4G -Xmx8G
-XX:+UseG1GC -XX:+ParallelRefProcEnabled
-XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions
-XX:+DisableExplicitGC -XX:+AlwaysPreTouch
-XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40
-XX:G1HeapRegionSize=8M -XX:G1ReservePercent=20
--add-modules=jdk.incubator.vector`}
          </pre>
          <button className="mt-3 text-xs text-primary hover:underline">
            Edit flags →
          </button>
        </div>

        <div className="glass rounded-2xl p-6">
          <SectionTitle title="Live Telemetry" />
          <div className="space-y-4">
            {[
              { l: "FPS", v: "512", max: "600", pct: 85, c: "bg-emerald-400" },
              {
                l: "Frame time",
                v: "1.9 ms",
                max: "16.6 ms",
                pct: 12,
                c: "bg-cyan-400",
              },
              {
                l: "GPU Usage",
                v: "48%",
                max: "100%",
                pct: 48,
                c: "bg-violet-400",
              },
              {
                l: "VRAM",
                v: "3.2 GB",
                max: "12 GB",
                pct: 27,
                c: "bg-fuchsia-400",
              },
            ].map((row) => (
              <div key={row.l}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">{row.l}</span>
                  <span className="font-mono">
                    {row.v}{" "}
                    <span className="text-muted-foreground">/ {row.max}</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${row.pct}%` }}
                    transition={{ duration: 1 }}
                    className={`h-full ${row.c}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Friends ------------------------------- */

function FriendsView() {
  return (
    <div className="space-y-6">
      <Header
        title="Friends"
        subtitle="Party up, join their world, or challenge them."
        action={
          <button className="flex items-center gap-1.5 rounded-full gradient-primary px-4 py-2 text-xs font-medium text-primary-foreground">
            <Plus className="h-3 w-3" /> Add Friend
          </button>
        }
      />
      <div className="glass overflow-hidden rounded-2xl">
        {friends.map((f, i) => (
          <div
            key={f.name}
            className={`flex items-center gap-4 p-4 ${i !== friends.length - 1 ? "border-b border-white/5" : ""} transition hover:bg-white/[0.03]`}
          >
            <div className="relative">
              <div className="grid h-11 w-11 place-items-center rounded-full gradient-primary font-display font-bold text-primary-foreground">
                {f.avatar}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${f.online ? "bg-emerald-400" : "bg-slate-500"}`}
              />
            </div>
            <div className="flex-1">
              <div className="font-semibold">{f.name}</div>
              <div className="text-xs text-muted-foreground">{f.status}</div>
            </div>
            {f.online && (
              <>
                <button className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium hover:bg-white/10">
                  Message
                </button>
                <button className="rounded-lg gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                  Join
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- News -------------------------------- */

function NewsView() {
  const articles = [
    {
      title: "Crest Pass Vol. 3 — The Deep Dark",
      tag: "Season",
      date: "Today",
      img: news3,
      desc: "80 tiers of exclusive cosmetics, capes and emotes drop this season.",
    },
    {
      title: "Snapshot 25w06a — New Copper Blocks",
      tag: "Mojang",
      date: "2 days ago",
      img: news2,
      desc: "Copper doors, copper bulbs and improved lightning behavior in the latest snapshot.",
    },
    {
      title: "Nether Speedrun Tournament",
      tag: "Event",
      date: "This weekend",
      img: news1,
      desc: "$10,000 prize pool, live commentary and duo brackets — sign up in-app.",
    },
  ];
  return (
    <div className="space-y-6">
      <Header
        title="News & Events"
        subtitle="Everything happening in the Crest universe."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {articles.map((a) => (
          <motion.article
            key={a.title}
            whileHover={{ y: -6 }}
            className="glass group overflow-hidden rounded-2xl"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <img
                src={a.img}
                alt=""
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-semibold backdrop-blur">
                {a.tag}
              </div>
            </div>
            <div className="p-5">
              <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                {a.date}
              </div>
              <h3 className="font-display text-lg font-semibold leading-snug">
                {a.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{a.desc}</p>
              <button className="mt-3 flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                Read more <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- Stats ------------------------------- */

function StatsView() {
  const stats = [
    { l: "Hours played", v: "1,284", sub: "+12 this week" },
    { l: "Blocks mined", v: "482k", sub: "Diamond: 214" },
    { l: "Mobs defeated", v: "38,412", sub: "Enderman: 902" },
    { l: "Deaths", v: "1,201", sub: "Mostly lava, honestly" },
    { l: "Distance walked", v: "912 km", sub: "≈ NYC to Chicago" },
    { l: "Achievements", v: "94 / 122", sub: "77% complete" },
  ];
  return (
    <div className="space-y-6">
      <Header
        title="Player Stats"
        subtitle="Your Minecraft journey, quantified."
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <motion.div
            key={s.l}
            whileHover={{ y: -4 }}
            className="glass rounded-2xl p-6"
          >
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              {s.l}
            </div>
            <div className="mt-1 font-display text-4xl font-bold text-gradient">
              {s.v}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{s.sub}</div>
          </motion.div>
        ))}
      </div>
      <div className="glass rounded-2xl p-6">
        <SectionTitle title="Weekly Play Time" />
        <div className="flex h-40 items-end justify-between gap-3">
          {[3, 5, 2, 6, 8, 4, 7].map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${h * 12}%` }}
                transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
                className="w-full rounded-t-lg gradient-primary"
              />
              <div className="text-[10px] text-muted-foreground">
                {"MTWTFSS"[i]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Settings ------------------------------ */

function SettingsView({
  profiles,
}: {
  profiles: ReturnType<typeof useOfflineProfiles>;
}) {
  const [newUsername, setNewUsername] = useState("");

  return (
    <div className="space-y-6">
      <Header title="Settings" subtitle="Personalize Crest to your taste." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SettingsGroup title="Offline Profiles" icon={Users}>
          {profiles.profiles.map((p) => (
            <div
              key={p.id}
              className={`rounded-xl border p-3 ${p.id === profiles.activeId ? "border-primary/40 bg-primary/10" : "border-white/10 bg-white/5"}`}
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full gradient-primary text-sm font-bold">
                  {p.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{p.username}</div>
                  <div className="text-[10px] text-muted-foreground">
                    Created {new Date(p.createdAt).toLocaleDateString()}
                    {p.id === profiles.activeId && (
                      <span className="ml-1.5 text-primary">· Active</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => profiles.removeProfile(p.id)}
                  className="rounded p-1.5 text-muted-foreground hover:bg-white/10 hover:text-rose-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          <div className="flex gap-1.5 mt-2">
            <input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newUsername.trim()) {
                  profiles.addProfile(newUsername.trim());
                  setNewUsername("");
                }
              }}
              placeholder="Add username…"
              className="flex-1 rounded-xl border border-dashed border-white/15 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={() => {
                if (newUsername.trim()) {
                  profiles.addProfile(newUsername.trim());
                  setNewUsername("");
                }
              }}
              className="rounded-xl gradient-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              <UserPlus className="h-4 w-4" />
            </button>
          </div>
        </SettingsGroup>

        <SettingsGroup title="Display" icon={Monitor}>
          <Toggle label="Fullscreen on launch" defaultOn />
          <Toggle label="Show FPS counter" defaultOn />
          <Toggle label="Reduce motion" />
          <Toggle label="Blur background" defaultOn />
        </SettingsGroup>

        <SettingsGroup title="Audio" icon={Volume2}>
          <Slider label="Master" value={80} />
          <Slider label="Music" value={45} />
          <Slider label="SFX" value={72} />
        </SettingsGroup>

        <SettingsGroup title="Controls" icon={Keyboard}>
          <KeyRow k="W" a="Move forward" />
          <KeyRow k="Space" a="Jump" />
          <KeyRow k="F3" a="Debug HUD" />
          <KeyRow k="F5" a="Toggle POV" />
        </SettingsGroup>

        <SettingsGroup title="Privacy" icon={Shield}>
          <Toggle label="Rich Presence (Discord)" defaultOn />
          <Toggle label="Share stats publicly" />
          <Toggle label="Anonymous analytics" defaultOn />
        </SettingsGroup>

        <SettingsGroup title="About" icon={Star}>
          <div className="space-y-2 text-sm">
            <Row l="Version" v="3.2.0" />
            <Row l="Build" v="2026.07.14" />
            <Row l="Java" v="21.0.4 LTS" />
            <Row l="OS" v="Windows 11 · x64" />
          </div>
          <button className="mt-3 w-full rounded-xl gradient-primary py-2.5 text-sm font-semibold text-primary-foreground">
            Check for updates
          </button>
        </SettingsGroup>
      </div>
    </div>
  );
}

function SettingsGroup({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="font-display font-semibold">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Toggle({ label, defaultOn }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <button
        onClick={() => setOn(!on)}
        className={`relative h-6 w-11 rounded-full transition ${on ? "gradient-primary" : "bg-white/10"}`}
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white ${on ? "left-[22px]" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}
function Slider({ label, value }: { label: string; value: number }) {
  const [v, setV] = useState(value);
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span>{label}</span>
        <span className="font-mono">{v}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={v}
        onChange={(e) => setV(Number(e.target.value))}
        className="w-full accent-violet-500"
      />
    </div>
  );
}
function KeyRow({ k, a }: { k: string; a: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{a}</span>
      <kbd className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-xs">
        {k}
      </kbd>
    </div>
  );
}
function Row({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{l}</span>
      <span className="font-mono">{v}</span>
    </div>
  );
}

function Header({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

/* ----------------------------- Crash Logs ----------------------------- */

const severityStyle: Record<
  CrashEntry["severity"],
  { chip: string; dot: string; label: string }
> = {
  fatal: {
    chip: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    dot: "bg-rose-400",
    label: "FATAL",
  },
  error: {
    chip: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    dot: "bg-amber-400",
    label: "ERROR",
  },
  warn: {
    chip: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    dot: "bg-sky-400",
    label: "WARN",
  },
};

function CrashLogsView() {
  const [selected, setSelected] = useState<CrashEntry>(crashLogs[0]);
  const [tab, setTab] = useState<"game" | "launcher">("game");
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<"all" | CrashEntry["severity"]>("all");

  const list =
    filter === "all"
      ? crashLogs
      : crashLogs.filter((c) => c.severity === filter);
  const active = list.includes(selected) ? selected : (list[0] ?? crashLogs[0]);
  const logText = tab === "game" ? active.gameLog : active.launcherLog;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(logText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <Header
        title="Crash Logs"
        subtitle="Every failed launch is captured here — inspect stack traces, compare launcher and game logs, and share."
        action={
          <div className="flex items-center gap-2">
            <button className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium hover:bg-white/10">
              <Folder className="h-3.5 w-3.5" /> Open folder
            </button>
            <button className="flex items-center gap-1.5 rounded-full gradient-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {(["all", "fatal", "error", "warn"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition ${
              filter === f
                ? "gradient-primary text-primary-foreground"
                : "glass hover:bg-white/10"
            }`}
          >
            {f === "all" ? "All" : severityStyle[f].label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,320px)_1fr]">
        {/* List */}
        <div className="glass overflow-hidden rounded-2xl">
          {list.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Nothing to see here — no crashes match this filter.
            </div>
          )}
          {list.map((c, i) => {
            const isActive = c.id === active.id;
            const s = severityStyle[c.severity];
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`w-full text-left px-4 py-3 transition ${i !== list.length - 1 ? "border-b border-white/5" : ""} ${
                  isActive ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${s.dot} shadow-[0_0_10px_currentColor]`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {c.title}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {c.when} · {c.version} · {c.loader}
                    </div>
                  </div>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 text-primary" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail */}
        <div className="glass overflow-hidden rounded-2xl">
          <div className="border-b border-white/5 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${severityStyle[active.severity].chip}`}
                  >
                    {severityStyle[active.severity].label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    exit {active.exit}
                  </span>
                </div>
                <h3 className="mt-2 font-display text-xl font-semibold leading-tight">
                  {active.title}
                </h3>
                <div className="mt-1 font-mono text-xs text-rose-300/90">
                  {active.cause}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={copy}
                  className="glass flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs hover:bg-white/10"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-300" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy log
                    </>
                  )}
                </button>
                <button className="glass flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs hover:bg-white/10">
                  <ExternalLink className="h-3.5 w-3.5" /> Report
                </button>
                <button className="flex items-center gap-1.5 rounded-lg bg-rose-500/15 border border-rose-500/25 px-3 py-1.5 text-xs text-rose-200 hover:bg-rose-500/25">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetaBox l="Version" v={active.version} />
              <MetaBox l="Loader" v={active.loader} />
              <MetaBox l="When" v={active.when} />
              <MetaBox l="Exit code" v={String(active.exit)} />
            </div>
          </div>

          <div className="flex items-center gap-1 border-b border-white/5 px-3 py-2">
            <LogTab
              active={tab === "game"}
              onClick={() => setTab("game")}
              icon={FileText}
              label="Game log"
            />
            <LogTab
              active={tab === "launcher"}
              onClick={() => setTab("launcher")}
              icon={Terminal}
              label="Launcher log"
            />
            <div className="ml-auto text-[10px] font-mono text-muted-foreground">
              {logText.split("\n").length} lines
            </div>
          </div>

          <pre className="max-h-[440px] overflow-auto bg-black/45 p-5 font-mono text-[11.5px] leading-relaxed">
            {logText.split("\n").map((line, i) => {
              const isErr = /ERROR|FATAL|Exception|Caused by/.test(line);
              const isWarn = /WARN/.test(line);
              const color = isErr
                ? "text-rose-300"
                : isWarn
                  ? "text-amber-300"
                  : line.startsWith("    at ")
                    ? "text-slate-400"
                    : "text-emerald-100/90";
              return (
                <div key={i} className="flex gap-3">
                  <span className="w-8 shrink-0 select-none text-right text-slate-600">
                    {i + 1}
                  </span>
                  <span className={color}>{line || " "}</span>
                </div>
              );
            })}
          </pre>
        </div>
      </div>
    </div>
  );
}

function MetaBox({ l, v }: { l: string; v: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
        {l}
      </div>
      <div className="mt-0.5 truncate font-mono text-xs">{v}</div>
    </div>
  );
}

function LogTab({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-white/10 text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

/* ------------------------------ Modpacks ------------------------------ */

function ModpacksView({ modpacks: mp }: { modpacks: ReturnType<typeof useModpacks> }) {
  const [query, setQuery] = useState("");

  const filtered = mp.modpacks.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <Header
        title="Modpacks"
        subtitle="Your modpacks — launch-ready configurations with version and loader settings."
      />

      <div className="flex items-center gap-3">
        <div className="glass flex items-center gap-2 rounded-full px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modpacks…"
            className="w-48 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {filtered.length} modpack{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
          <Boxes className="h-12 w-12 opacity-30" />
          <p className="text-sm">No modpacks yet. Create one from the Home or Versions tab.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => (
            <motion.div
              key={m.id}
              whileHover={{ y: -4 }}
              className="glass group relative flex flex-col overflow-hidden rounded-2xl p-5"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl gradient-primary">
                    <Boxes className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-display text-base font-semibold leading-tight">
                      {m.name}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      Created {new Date(m.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-md bg-white/[0.03] px-2.5 py-1.5">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
                    MC
                  </div>
                  <div className="font-mono">
                    {m.mcVersion} · {m.loaderType}
                  </div>
                </div>
                <div className="rounded-md bg-white/[0.03] px-2.5 py-1.5">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
                    Mods
                  </div>
                  <div className="font-mono">{m.mods.length}</div>
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => mp.removeModpack(m.id)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs text-muted-foreground hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
