import { useEffect, useCallback } from "react";
import { Command } from "cmdk";
import {
  Home,
  Package,
  Server,
  Palette,
  Users,
  Settings,
  Newspaper,
  Trophy,
  Gauge,
  Shield,
  FileWarning,
  Boxes,
  Moon,
  Sun,
  Monitor,
  LogIn,
  LogOut,
  Play,
  Search,
  X,
} from "lucide-react";
import { useTheme } from "@/components/launcher/ThemeCustomizer";
import type { NavId } from "@/components/launcher/layout";

const navCommands: { id: NavId; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "versions", label: "Versions", icon: Package },
  { id: "modpacks", label: "Modpacks", icon: Boxes },
  { id: "mods", label: "Mods", icon: Shield },
  { id: "servers", label: "Servers", icon: Server },
  { id: "cosmetics", label: "Cosmetics", icon: Palette },
  { id: "performance", label: "Performance", icon: Gauge },
  { id: "crashes", label: "Crash Logs", icon: FileWarning },
  { id: "friends", label: "Friends", icon: Users },
  { id: "news", label: "News", icon: Newspaper },
  { id: "stats", label: "Stats", icon: Trophy },
  { id: "settings", label: "Settings", icon: Settings },
];

export function CommandPalette({
  open,
  onClose,
  activeNav,
  onNavigate,
  launching,
  gameRunning,
  onLaunch,
  onLoginClick,
  hasSession,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  activeNav: NavId;
  onNavigate: (id: NavId) => void;
  launching: boolean;
  gameRunning: boolean;
  onLaunch: () => void;
  onLoginClick: () => void;
  hasSession: boolean;
  onLogout: () => void;
}) {
  const { mode, toggleMode } = useTheme();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) onClose();
        else onClose(); // toggle handled by parent
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleSelect = useCallback(
    (value: string) => {
      if (value.startsWith("nav:")) {
        onNavigate(value.slice(4) as NavId);
        onClose();
      } else if (value === "action:launch" && !launching) {
        onLaunch();
        onClose();
      } else if (value === "action:theme") {
        toggleMode();
      } else if (value === "action:login") {
        onLoginClick();
        onClose();
      } else if (value === "action:logout") {
        onLogout();
        onClose();
      }
    },
    [onNavigate, onClose, launching, onLaunch, toggleMode, onLoginClick, onLogout],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <Command
        className="glass-elev-5 relative z-10 w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl"
        shouldFilter
        loop
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Command.Input
            autoFocus
            placeholder="Type a command or search…"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={onClose}
            className="rounded-lg bg-white/5 p-1 text-muted-foreground transition hover:bg-white/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* List */}
        <Command.List className="max-h-[360px] overflow-y-auto p-2">
          <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
            No results found.
          </Command.Empty>

          {/* Navigation */}
          <Command.Group heading="Navigate" className="px-2 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            {navCommands.map(({ id, label, icon: Icon }) => (
              <Command.Item
                key={id}
                value={`nav:${id}`}
                onSelect={handleSelect}
                className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors data-[selected=true]:bg-white/[0.08] data-[selected=true]:text-foreground"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
                {activeNav === id && (
                  <span className="ml-auto text-[10px] font-medium text-primary">
                    Current
                  </span>
                )}
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Separator className="my-1 h-px bg-white/[0.06]" />

          {/* Actions */}
          <Command.Group heading="Actions" className="px-2 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            {!gameRunning && (
              <Command.Item
                value="action:launch"
                onSelect={handleSelect}
                disabled={launching}
                className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors data-[selected=true]:bg-white/[0.08] data-[selected=true]:text-foreground"
              >
                <Play className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{launching ? "Launching…" : "Launch Game"}</span>
              </Command.Item>
            )}

            <Command.Item
              value="action:theme"
              onSelect={handleSelect}
              className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors data-[selected=true]:bg-white/[0.08] data-[selected=true]:text-foreground"
            >
              {mode === "dark" ? (
                <Moon className="h-4 w-4 shrink-0" />
              ) : mode === "light" ? (
                <Sun className="h-4 w-4 shrink-0" />
              ) : (
                <Monitor className="h-4 w-4 shrink-0" />
              )}
              <span>
                Switch to{" "}
                {mode === "dark" ? "Light" : mode === "light" ? "Dark" : "System"} theme
              </span>
            </Command.Item>

            {!hasSession ? (
              <Command.Item
                value="action:login"
                onSelect={handleSelect}
                className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors data-[selected=true]:bg-white/[0.08] data-[selected=true]:text-foreground"
              >
                <LogIn className="h-4 w-4 shrink-0" />
                <span>Sign in / Create account</span>
              </Command.Item>
            ) : (
              <Command.Item
                value="action:logout"
                onSelect={handleSelect}
                className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors data-[selected=true]:bg-white/[0.08] data-[selected=true]:text-foreground"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>Sign out</span>
              </Command.Item>
            )}
          </Command.Group>
        </Command.List>

        {/* Footer hint */}
        <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2 text-[10px] text-muted-foreground">
          <span>
            <kbd className="mr-1 rounded bg-white/10 px-1 py-0.5">↑↓</kbd> Navigate
          </span>
          <span>
            <kbd className="mr-1 rounded bg-white/10 px-1 py-0.5">↵</kbd> Select
          </span>
          <span>
            <kbd className="mr-1 rounded bg-white/10 px-1 py-0.5">Esc</kbd> Close
          </span>
        </div>
      </Command>
    </div>
  );
}
