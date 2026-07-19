import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Boxes,
  Plus,
  ChevronDown,
  Check,
  HardDrive,
  Sparkles,
  Loader2,
  Shield,
  Server,
  Settings,
  Newspaper,
  Users,
  Clock,
  ExternalLink,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PrimaryButton, GhostButton, Chip } from "@/components/launcher/parts";
import type {
  ModpacksHook,
  ProfilesHook,
  SessionResult,
} from "@/components/launcher/lib/types";
import { useVersionData } from "@/components/launcher/lib/use-version-data";
import { CreateModpackModal } from "@/components/launcher/modals/CreateModpackModal";
import { newsPreview, friends } from "@/components/launcher/data";
import {
  installVersion,
  ensureJava,
  launchGame,
} from "@/lib/tauri-commands";
import heroBg from "@/assets/hero-bg.jpg";

export function HomeView({
  profiles,
  modpacks,
  launching,
  setLaunching,
  gameRunning,
  setGameRunning,
  session,
}: {
  profiles: ProfilesHook;
  modpacks: ModpacksHook;
  launching: boolean;
  setLaunching: (v: boolean) => void;
  gameRunning: boolean;
  setGameRunning: (v: boolean) => void;
  session: SessionResult | null;
}) {
  const { versions, loading: versionsLoading } = useVersionData();
  const [ram, setRam] = useState(8);
  const [progress, setProgress] = useState(0);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [showCreateModpack, setShowCreateModpack] = useState(false);
  const [homeSelectorOpen, setHomeSelectorOpen] = useState(false);

  const active = modpacks.activeModpack;
  const badVersion =
    active && !/^\d+\.\d+(\.\d+)?$/.test(active.mcVersion);

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
      const installedId = await installVersion(
        active.mcVersion,
        active.loaderType,
      );
      setProgress(80);
      await launchGame(
        installedId,
        Number(ram) * 1024,
        active.name,
        session?.account?.id,
      );
      setProgress(100);
      setGameRunning(true);
      setLaunching(false);
    } catch (err) {
      if (
        err instanceof TypeError &&
        (err.message === "Failed to fetch" ||
          err.message.includes("fetch"))
      ) {
        setLaunchError(
          "API unreachable — make sure the backend is running (scripts/dev.sh)",
        );
      } else {
        setLaunchError(String(err));
      }
      setLaunching(false);
    }
  };

  const onlineFriends = friends.filter((f) => f.online).slice(0, 4);

  return (
    <>
      <div className="space-y-6">
        {/* ── HERO BANNER ────────────────────────────────────────────── */}
        <div className="relative -mx-8 -mt-8 overflow-hidden rounded-b-3xl">
          <div className="relative h-[220px] w-full">
            {/* Background image */}
            <img
              src={heroBg}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />

            {/* Content */}
            <div className="relative flex h-full flex-col justify-end px-8 pb-6">
              <div className="flex items-end justify-between">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                    </span>
                    Crest Client · v3.2.0
                  </div>
                  <h1 className="font-display text-4xl font-bold leading-[0.95] tracking-tight sm:text-5xl">
                    Ready when <span className="text-gradient">you are</span>.
                  </h1>
                </div>

                {/* Status chips */}
                <div className="hidden items-center gap-2 md:flex">
                  <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Java 21
                  </span>
                  <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px]">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        session ? "bg-emerald-400" : "bg-muted-foreground",
                      )}
                    />
                    {session ? session.account.display_name : "Offline"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── TWO-COLUMN BODY ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          {/* ── LEFT: LAUNCH CONTROL ──────────────────────────── */}
          <div className="space-y-5">
            {modpacks.modpacks.length === 0 ? (
              /* Empty state — no modpacks */
              <div className="glass-elev-2 rounded-2xl p-10 text-center">
                <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl gradient-primary">
                  <Boxes className="h-8 w-8 text-primary-foreground" />
                </div>
                <h2 className="font-display text-xl font-semibold">
                  Your first step into the world
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  Create a modpack to pick your Minecraft version, choose a
                  modloader, and start playing.
                </p>
                <div className="mx-auto mt-6 flex max-w-xs items-center justify-center gap-3 text-[11px] text-muted-foreground/60">
                  <span className="flex items-center gap-1.5">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-white/5 text-[9px] font-bold">
                      1
                    </span>
                    Create
                  </span>
                  <span className="h-px w-6 bg-white/10" />
                  <span className="flex items-center gap-1.5">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-white/5 text-[9px] font-bold">
                      2
                    </span>
                    Pick mods
                  </span>
                  <span className="h-px w-6 bg-white/10" />
                  <span className="flex items-center gap-1.5">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-white/5 text-[9px] font-bold">
                      3
                    </span>
                    Launch
                  </span>
                </div>
                <button
                  onClick={() => setShowCreateModpack(true)}
                  className="mx-auto mt-6 inline-flex items-center gap-2 rounded-xl gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.74_0.17_152_/_0.55)] transition hover:scale-105 active:scale-95"
                >
                  <Plus className="h-4 w-4" /> Create Your First Modpack
                </button>
              </div>
            ) : (
              <>
                {/* Active modpack card */}
                <div className="glass-elev-3 rounded-2xl p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Active Modpack
                    </span>
                    <button
                      onClick={() => setShowCreateModpack(true)}
                      className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium transition hover:bg-white/10"
                    >
                      <Plus className="h-3 w-3" /> New
                    </button>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setHomeSelectorOpen(!homeSelectorOpen)}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-xl p-3 text-left transition",
                        homeSelectorOpen
                          ? "bg-white/[0.06] ring-1 ring-primary/30"
                          : "hover:bg-white/[0.04]",
                      )}
                    >
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl gradient-primary">
                        <Boxes className="h-7 w-7 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-lg font-semibold leading-tight">
                          {active!.name}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{active!.mcVersion}</span>
                          <span>·</span>
                          <span
                            className={cn(
                              "font-medium",
                              active!.loaderType === "fabric"
                                ? "text-violet-400"
                                : "text-sky-400",
                            )}
                          >
                            {active!.loaderType === "fabric"
                              ? "Fabric"
                              : "Vanilla"}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last played 2h ago
                          </span>
                        </div>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                          homeSelectorOpen && "rotate-180",
                        )}
                      />
                    </button>

                    <AnimatePresence>
                      {homeSelectorOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.97 }}
                          transition={{ duration: 0.15 }}
                          className="glass-strong absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl shadow-xl"
                        >
                          <div className="max-h-64 overflow-y-auto p-2">
                            {modpacks.modpacks.map((mp) => {
                              const isActive = mp.id === modpacks.activeId;
                              return (
                                <button
                                  key={mp.id}
                                  onClick={() => {
                                    modpacks.selectModpack(mp.id);
                                    setHomeSelectorOpen(false);
                                  }}
                                  className={cn(
                                    "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition",
                                    isActive
                                      ? "bg-primary/15 ring-1 ring-primary/30"
                                      : "hover:bg-white/5",
                                  )}
                                >
                                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-primary">
                                    <Boxes className="h-5 w-5 text-primary-foreground" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="truncate text-sm font-semibold">
                                      {mp.name}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                      <span>{mp.mcVersion}</span>
                                      <span>·</span>
                                      <span
                                        className={
                                          mp.loaderType === "fabric"
                                            ? "text-violet-400"
                                            : "text-sky-400"
                                        }
                                      >
                                        {mp.loaderType === "fabric"
                                          ? "Fabric"
                                          : "Vanilla"}
                                      </span>
                                    </div>
                                  </div>
                                  {isActive && (
                                    <Check className="h-4 w-4 shrink-0 text-primary" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Launch button — wide rectangular */}
                <div className="space-y-3">
                  <button
                    onClick={handleLaunch}
                    disabled={
                      launching || gameRunning || !profiles.activeProfile
                    }
                    className={cn(
                      "group relative flex h-14 w-full items-center justify-center gap-3 rounded-2xl font-display text-base font-bold tracking-wide text-primary-foreground shadow-[var(--shadow-glow)] transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
                      !launching && !gameRunning && "gradient-primary hover:scale-[1.02] active:scale-[0.98]",
                      launching && "gradient-primary",
                      gameRunning && "bg-emerald-500/90 hover:bg-emerald-500/80",
                    )}
                  >
                    {/* Pulse ring when idle */}
                    {!launching && !gameRunning && (
                      <span className="pointer-events-none absolute inset-0 rounded-2xl animate-pulse-ring border border-primary/40" />
                    )}

                    {launching ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Launching… {progress}%</span>
                      </>
                    ) : gameRunning ? (
                      <>
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                        </span>
                        <span>Playing</span>
                        <Square className="h-4 w-4 fill-current" />
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 fill-current" />
                        <span>Play</span>
                      </>
                    )}
                  </button>

                  {/* Launch progress bar */}
                  {launching && (
                    <div className="h-1 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: "linear", duration: 0.06 }}
                        className="h-full gradient-primary"
                      />
                    </div>
                  )}

                  {/* Error / warning */}
                  {!profiles.activeProfile && (
                    <p className="text-center text-xs text-muted-foreground">
                      Create or select an offline profile to launch
                    </p>
                  )}
                  {badVersion && (
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-center">
                      <p className="text-xs text-rose-300">
                        Bad MC version "{active?.mcVersion}" — cannot launch.
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
                    <p className="text-center text-xs text-rose-300">
                      {launchError}
                    </p>
                  )}
                </div>

                {/* Quick settings strip */}
                <div className="glass rounded-2xl px-5 py-4">
                  <div className="flex items-center gap-6">
                    {/* RAM */}
                    <div className="flex flex-1 items-center gap-3">
                      <HardDrive className="h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                          <span>RAM</span>
                          <span className="font-mono text-foreground/80">
                            {ram} GB
                          </span>
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

                    {/* Divider */}
                    <div className="h-8 w-px bg-white/[0.06]" />

                    {/* Loader + Version info */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        <span className="text-foreground/60">Loader </span>
                        <span
                          className={cn(
                            "font-medium",
                            active!.loaderType === "fabric"
                              ? "text-violet-400"
                              : "text-sky-400",
                          )}
                        >
                          {active!.loaderType === "fabric"
                            ? "Fabric"
                            : "Vanilla"}
                        </span>
                      </span>
                      <span>
                        <span className="text-foreground/60">MC </span>
                        <span className="font-medium text-foreground/80">
                          {active!.mcVersion}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick actions grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Browse Mods",
                      icon: Shield,
                      nav: "mods" as const,
                      desc: "Discover & install",
                    },
                    {
                      label: "Add Server",
                      icon: Server,
                      nav: "servers" as const,
                      desc: "Multiplayer",
                    },
                    {
                      label: "Modpacks",
                      icon: Boxes,
                      nav: "modpacks" as const,
                      desc: "Manage packs",
                    },
                    {
                      label: "Settings",
                      icon: Settings,
                      nav: "settings" as const,
                      desc: "Customize",
                    },
                  ].map((action) => (
                    <button
                      key={action.label}
                      className="glass group flex items-center gap-3 rounded-xl p-3.5 text-left transition hover:bg-white/[0.06]"
                    >
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/5 group-hover:bg-white/[0.08]">
                        <action.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold">
                          {action.label}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {action.desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Fabric · Sodium · Iris hint */}
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/60">
                  <Sparkles className="h-3 w-3 text-primary/60" />
                  <span>Fabric · Sodium · Iris — pre-tuned</span>
                </div>
              </>
            )}
          </div>

          {/* ── RIGHT: FEED PANEL ─────────────────────────────── */}
          <div className="space-y-5">
            {/* News */}
            <div className="glass-elev-2 rounded-2xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  News
                </span>
                <span className="text-[10px] text-primary/60">View all →</span>
              </div>
              <div className="space-y-3">
                {newsPreview.map((article) => (
                  <div
                    key={article.id}
                    className="group flex gap-3 rounded-xl p-2 transition hover:bg-white/[0.04] cursor-pointer"
                  >
                    <img
                      src={article.image}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-medium uppercase tracking-wider text-primary/70">
                          {article.tag}
                        </span>
                        <span className="text-[9px] text-muted-foreground/50">
                          {article.date}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-xs font-semibold leading-tight group-hover:text-foreground">
                        {article.title}
                      </div>
                      <div className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground/70">
                        {article.excerpt}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Friends online */}
            <div className="glass-elev-2 rounded-2xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Friends Online
                </span>
                <span className="text-[10px] text-muted-foreground/50">
                  {friends.filter((f) => f.online).length} online
                </span>
              </div>

              {!session ? (
                <div className="py-4 text-center">
                  <Users className="mx-auto mb-2 h-6 w-6 text-muted-foreground/30" />
                  <p className="text-[11px] text-muted-foreground/60">
                    Sign in to see friends
                  </p>
                </div>
              ) : onlineFriends.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-[11px] text-muted-foreground/60">
                    No friends online right now
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {onlineFriends.map((f) => (
                    <div
                      key={f.name}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-white/[0.04]"
                    >
                      <div className="relative">
                        <div className="grid h-8 w-8 place-items-center rounded-full gradient-primary text-[10px] font-bold text-primary-foreground">
                          {f.avatar}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold">
                          {f.name}
                        </div>
                        <div className="truncate text-[10px] text-muted-foreground/70">
                          {f.status}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] text-primary/60 transition hover:text-primary">
                    <Users className="h-3 w-3" />
                    View all friends
                  </button>
                </div>
              )}
            </div>

            {/* System stats mini */}
            <div className="glass-elev-2 rounded-2xl p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  System
                </span>
                <span className="text-[10px] font-medium text-primary/70">
                  Optimal
                </span>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "CPU", value: 22, color: "bg-emerald-400" },
                  { label: "RAM", value: 41, color: "bg-cyan-400" },
                  { label: "Net", value: 12, color: "bg-violet-400" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="mb-1 flex justify-between text-[10px]">
                      <span className="text-muted-foreground">
                        {stat.label}
                      </span>
                      <span className="font-mono text-foreground/70">
                        {stat.value}%
                      </span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.value}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={cn("h-full", stat.color)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
            const result = modpacks.addModpack(
              name,
              mcVersion,
              loaderType,
            );
            if (result) {
              import("@/lib/tauri-commands").then((m) =>
                m.createInstance(name, mcVersion, loaderType).catch(
                  () => {},
                ),
              );
              setShowCreateModpack(false);
            }
          }}
        />
      )}
    </>
  );
}
