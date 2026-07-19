import { useState, useRef } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PrimaryButton, ViewHeader } from "@/components/launcher/parts";
import { useModpacks } from "@/hooks/use-modpacks";
import { useOfflineProfiles } from "@/hooks/use-offline-profiles";
import type {
  ModpacksHook,
  ProfilesHook,
  SessionResult,
} from "@/components/launcher/lib/types";
import { useVersionData } from "@/components/launcher/lib/use-version-data";
import { CreateModpackModal } from "@/components/launcher/modals/CreateModpackModal";
import { installVersion, ensureJava, launchGame, killGame } from "@/lib/tauri-commands";

/* ----------------------------------------------------------------------------
   HomeView — the iconic launch hub
   - Session chip
   - "Ready when you are." wordmark
   - Quick-switch modpack selector (dropdown)
   - Big LaunchButton (h-20 w-20 circular)
   - RAM slider
   - Empty-state CTA
   ---------------------------------------------------------------------------- */
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
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px]",
                session
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-white/10 text-muted-foreground",
              )}
            >
              {session ? "Crest Account" : "Offline"}
            </span>
          </div>
          <div className="hidden items-center gap-4 text-[11px] text-muted-foreground sm:flex">
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
              ? `Playing ${active.name} — ${active.mcVersion} ${active.loaderType === "fabric" ? "Fabric" : "Vanilla"}`
              : "Create a modpack to get started."}
          </p>
        </div>

        {/* Modpack selector + Launch button */}
        {modpacks.modpacks.length === 0 ? (
          <div className="mx-auto mt-10 max-w-md text-center">
            <div className="glass rounded-2xl p-8">
              <Boxes className="mx-auto mb-4 h-10 w-10 text-primary" />
              <div className="font-display text-lg font-semibold">
                No modpacks yet
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first modpack to pick a Minecraft version and
                modloader.
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
          <div className="mx-auto mt-10 w-full max-w-xl space-y-8">
            {/* Modpack quick-switch */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Modpack
                </div>
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
                    "glass flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left transition",
                    homeSelectorOpen
                      ? "ring-2 ring-primary/40"
                      : "hover:bg-white/[0.04]",
                  )}
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl gradient-primary">
                    <Boxes className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-base font-semibold">
                      {active!.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{active!.mcVersion}</span>
                      <span>·</span>
                      <span
                        className={
                          active!.loaderType === "fabric"
                            ? "text-violet-400"
                            : "text-sky-400"
                        }
                      >
                        {active!.loaderType === "fabric" ? "Fabric" : "Vanilla"}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
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
                      <div className="max-h-72 overflow-y-auto p-2">
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
                                "flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left transition",
                                isActive
                                  ? "bg-primary/15 ring-1 ring-primary/30"
                                  : "hover:bg-white/5",
                              )}
                            >
                              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl gradient-primary">
                                <Boxes className="h-5 w-5 text-primary-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="truncate text-sm font-semibold">
                                  {mp.name}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
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
                                <Check className="h-5 w-5 shrink-0 text-primary" />
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

            {/* Launch button */}
            {active && (
              <>
                <div className="flex flex-col items-center">
                  <button
                    onClick={handleLaunch}
                    disabled={
                      launching || gameRunning || !profiles.activeProfile
                    }
                    className="group relative mx-auto flex h-20 w-20 items-center justify-center rounded-full gradient-primary text-primary-foreground shadow-[var(--shadow-glow)] transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Launch game"
                  >
                    <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/20" />
                    {!launching && !gameRunning && (
                      <span className="pointer-events-none absolute inset-0 rounded-full animate-pulse-ring border border-primary/50" />
                    )}
                    {launching ? (
                      <span className="font-mono text-xs font-semibold">
                        {progress}%
                      </span>
                    ) : gameRunning ? (
                      <span className="flex items-center gap-1">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                        </span>
                      </span>
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
                        Bad MC version "{active?.mcVersion}" — cannot launch.
                        Remove this modpack and create a new one.
                      </p>
                      <button
                        onClick={() =>
                          modpacks.removeModpack(active!.id)
                        }
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
                </div>

                {/* RAM slider */}
                <div className="mx-auto flex max-w-sm items-center gap-3 rounded-2xl glass px-4 py-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/5">
                    <HardDrive className="h-4 w-4 text-primary" />
                  </div>
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
              </>
            )}

            <div className="mt-4 text-center text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" /> Fabric · Sodium ·
                Iris — pre-tuned
              </span>
            </div>
          </div>
        )}
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
