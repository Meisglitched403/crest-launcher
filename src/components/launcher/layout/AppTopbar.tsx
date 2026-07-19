import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
  ChevronDown,
  X,
  LogOut,
  Boxes,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeTrigger } from "@/components/launcher/ThemeCustomizer";
import type { SessionResult } from "@/lib/tauri-commands";
import { logout as apiLogout } from "@/lib/tauri-commands";
import type { ModpacksHook } from "@/components/launcher/lib/types";

/* ----------------------------------------------------------------------------
   AppTopbar — unified command center
   - Pill search (wired to cmdk later)
   - ThemeTrigger, Bell
   - Running game chip
   - Modpack indicator chip
   - API health dot
   - Account dropdown with avatar/initials
   ---------------------------------------------------------------------------- */
export function AppTopbar({
  profiles,
  modpacks,
  launching,
  gameRunning,
  setGameRunning,
  session,
  backendOnline,
  onLoginClick,
  onLogout,
  onCommandOpen,
}: {
  profiles: { profiles: { id: string; username: string }[]; activeId: string | null };
  modpacks: ModpacksHook;
  launching: boolean;
  gameRunning: boolean;
  setGameRunning: (v: boolean) => void;
  session: SessionResult | null;
  backendOnline: boolean;
  onLoginClick: () => void;
  onLogout: () => void;
  onCommandOpen: () => void;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const initials = (name: string) => name.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 px-8 py-5">
      {/* Search pill — triggers command palette */}
      <button
        onClick={onCommandOpen}
        className="glass flex flex-1 items-center gap-2 rounded-full px-4 py-2.5 text-left transition hover:bg-white/[0.06]"
      >
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="w-full text-sm text-muted-foreground">
          Search mods, servers, versions, friends…
        </span>
        <kbd className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      {/* Theme + Bell */}
      <ThemeTrigger />
      <button className="glass rounded-full p-2.5 transition hover:bg-white/10">
        <Bell className="h-4 w-4" />
      </button>

      {/* Running game chip */}
      {gameRunning && (
        <button
          onClick={() => setGameRunning(false)}
          className="glass flex items-center gap-2 rounded-full px-3 py-2 text-xs"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="font-medium text-emerald-300">Running</span>
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      )}

      {/* Modpack indicator */}
      {modpacks.activeModpack && (
        <div className="glass flex items-center gap-2 rounded-full px-3 py-2 text-xs">
          <Boxes className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium">{modpacks.activeModpack.name}</span>
          <span className="text-[10px] text-muted-foreground">
            {modpacks.activeModpack.mcVersion} ·{" "}
            {modpacks.activeModpack.loaderType === "fabric"
              ? "Fabric"
              : "Vanilla"}
          </span>
        </div>
      )}

      {/* API status */}
      <span className="glass flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px]">
        <span
          className={`h-1.5 w-1.5 rounded-full ${backendOnline ? "bg-emerald-400" : "bg-rose-400"}`}
        />
        <span
          className={cn(
            backendOnline ? "text-emerald-400" : "text-rose-400",
            "font-medium",
          )}
        >
          {backendOnline ? "API" : "API off"}
        </span>
      </span>

      {/* Profile dropdown */}
      <div className="relative">
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="glass flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-3"
        >
          {gameRunning && (
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
            </span>
          )}
          <div className="grid h-8 w-8 place-items-center rounded-full gradient-primary text-xs font-bold text-primary-foreground">
            {session ? initials(session.account.display_name) : "?"}
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold leading-tight">
              {session ? session.account.display_name : "Not signed in"}
            </div>
            <div
              className={cn(
                "text-[10px]",
                session ? "text-emerald-400" : "text-muted-foreground",
              )}
            >
              {session ? "Crest Account" : "Offline"}
            </div>
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
              onClick={() => setProfileOpen(false)}
            >
              {session ? (
                <>
                  <div className="border-b border-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">
                        {initials(session.account.display_name)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">
                          {session.account.display_name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Crest Account
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        apiLogout().catch(() => {});
                        setProfileOpen(false);
                        window.location.reload();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-white/5"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-4 space-y-2">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Account
                  </div>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      onLoginClick();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    Sign in / Create account
                  </button>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Sign in to use your Crest account across devices with a
                    persistent identity and UUID.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}