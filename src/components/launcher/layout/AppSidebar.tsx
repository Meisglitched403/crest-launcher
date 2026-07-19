import { motion, AnimatePresence } from "framer-motion";
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
  Cpu,
  HardDrive,
  Wifi,
  PanelLeftClose,
  PanelLeft,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { StatBar } from "@/components/launcher/parts";
import { useTheme } from "@/components/launcher/ThemeCustomizer";
import logo from "@/assets/logo.png";

export const navItems: {
  id: NavId;
  label: string;
  icon: LucideIcon;
}[] = [
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

export type NavId =
  | "home"
  | "versions"
  | "modpacks"
  | "mods"
  | "servers"
  | "cosmetics"
  | "performance"
  | "crashes"
  | "friends"
  | "news"
  | "stats"
  | "settings";

/* ----------------------------------------------------------------------------
   AppSidebar — refined glass sidebar.
   - lg+ : 16rem (w-64) full sidebar with system stats widget
   - below lg collapses to icon-only rail (w-[68px])
   - collapses further if user toggles condensed mode
   - layoutId nav-active pill animates between active items
   ---------------------------------------------------------------------------- */
export function AppSidebar({
  active,
  setActive,
}: {
  active: NavId;
  setActive: (id: NavId) => void;
}) {
  const [condensed, setCondensed] = useState(false);
  const { motion: motionLevel } = useTheme();
  const reduceMotion = motionLevel === 0;

  return (
    <aside
      className={cn(
        "glass-strong sticky top-0 z-30 flex h-screen shrink-0 flex-col gap-2 p-4 transition-[width] duration-300",
        condensed ? "w-[76px]" : "w-64",
      )}
    >
      {/* Header / logo */}
      <div className="mb-4 flex items-center gap-3">
        <img
          src={logo}
          alt="Crest Client"
          className="h-11 w-11 shrink-0 drop-shadow-[0_0_18px_oklch(0.74_0.17_152_/_0.55)]"
        />
        {!condensed && (
          <div className="min-w-0">
            <div className="font-display text-lg font-semibold leading-tight">
              Crest Client
            </div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              v3.2.0 · Stable
            </div>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCondensed((c) => !c)}
        title={condensed ? "Expand" : "Collapse"}
        className={cn(
          "grid h-9 w-full place-items-center rounded-xl border border-border bg-white/[0.03] text-muted-foreground transition hover:bg-white/[0.08] hover:text-foreground",
        )}
      >
        {condensed ? (
          <PanelLeft className="h-4 w-4" />
        ) : (
          <PanelLeftClose className="h-4 w-4" />
        )}
      </button>

      {/* Nav */}
      <nav className="mt-2 flex flex-1 flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              title={condensed ? item.label : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-white/[0.06] hover:text-foreground",
                isActive && "text-primary-foreground",
                condensed && "justify-center px-2",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl gradient-primary shadow-[0_10px_30px_-10px_oklch(0.74_0.17_152_/_0.6)]"
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 400, damping: 34 }
                  }
                />
              )}
              <Icon
                className={cn(
                  "relative z-10 h-4 w-4 shrink-0",
                  isActive && "text-primary-foreground",
                )}
              />
              {!condensed && <span className="relative z-10">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* System stats */}
      {!condensed && (
        <div className="glass-elev-2 mt-2 rounded-2xl p-3">
          <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-widest text-muted-foreground">
            <span>System</span>
            <span className="text-primary">Optimal</span>
          </div>
          <StatBar icon={Cpu} label="CPU" value={22} />
          <StatBar icon={HardDrive} label="RAM" value={41} />
          <StatBar icon={Wifi} label="Net" value={12} />
        </div>
      )}
    </aside>
  );
}
