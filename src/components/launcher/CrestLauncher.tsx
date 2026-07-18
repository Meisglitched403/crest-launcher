import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  Edit,
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
  friends,
  cosmetics,
  rarityColor,
  modpacks as staticModpacks,
  type NavId,
  type CrashEntry,
  type LiveVersion,
  type Modpack as StaticModpack,
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
import { useModpacks, type Modpack } from "@/hooks/use-modpacks";
import {
  API_BASE,
  installVersion,
  launchGame,
  ensureJava,
  getInstalledVersions,
  isInstalled,
  searchMods,
  installMod,
  removeMod,
  listMods,
  untrackedMods,
  adoptMod,
  toggleMod,
  createInstance,
  openModsFolder,
  fetchServers,
  addServer,
  removeServer,
  pingServer,
  fetchGameStatus,
  killGame,
  signup,
  login,
  fetchSession,
  logout as apiLogout,
  checkAvailability,
  type InstalledVersion,
  type ModResult,
  type ServerEntry,
  type PingResult,
  type CrestAccount,
  type SessionResult,
} from "@/lib/tauri-commands";

export function CrestLauncher() {
  return (
    <ThemeProvider>
      <CrestLauncherInner />
    </ThemeProvider>
  );
}

const createModpackModalMixin = {
  ready: true,
};

function useModpackCreateModal(modpacks: ReturnType<typeof useModpacks>) {
  const [open, setOpen] = useState(false);
  const versions = useVersionData();

  const modal = open ? (
    <CreateModpackModal
      versions={versions.versions}
      versionsLoading={versions.loading}
      onClose={() => setOpen(false)}
      onCreateModpack={(name, mcVersion, loaderType) => {
        const result = modpacks.addModpack(name, mcVersion, loaderType);
        if (result) {
          createInstance(name, mcVersion, loaderType).catch(() => {});
          setOpen(false);
        }
      }}
    />
  ) : null;

  return { openCreateModal: () => setOpen(true), createModal: modal };
}

function ModpackActions({ modpack, modpacks }: { modpack: Modpack; modpacks: ReturnType<typeof useModpacks> }) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(modpack.name);

  const startRename = () => { setName(modpack.name); setRenaming(true); };

  const cancelRename = () => { setName(modpack.name); setRenaming(false); };

  const commitRename = () => {
    if (name.trim() && name.trim() !== modpack.name) {
      modpacks.updateModpack(modpack.id, { name: name.trim() });
    }
    setRenaming(false);
  };

  return { renaming, name, setName, startRename, cancelRename, commitRename };
}

function ModpackCard({ modpack, modpacks }: { modpack: Modpack; modpacks: ReturnType<typeof useModpacks> }) {
  const rename = ModpackActions({ modpack, modpacks });

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass group relative flex flex-col overflow-hidden rounded-2xl p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl gradient-primary">
            <Boxes className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            {rename.renaming ? (
              <input
                value={rename.name}
                onChange={(e) => rename.setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') rename.commitRename(); if (e.key === 'Escape') rename.cancelRename(); }}
                className="w-full rounded-md border border-white/20 bg-white/5 px-2 py-0.5 font-display text-base font-semibold outline-none"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="truncate font-display text-base font-semibold leading-tight">
                {modpack.name}
              </div>
            )}
            <div className="truncate text-[11px] text-muted-foreground">
              Created {new Date(modpack.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        {!rename.renaming && (
          <button
            onClick={(e) => { e.stopPropagation(); rename.startRename(); }}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10"
            title="Rename"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-md bg-white/[0.03] px-2.5 py-1.5">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">MC</div>
          <div className="font-mono">{modpack.mcVersion} · {modpack.loaderType}</div>
        </div>
        <div className="rounded-md bg-white/[0.03] px-2.5 py-1.5">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Mods</div>
          <div className="font-mono">{modpack.mods.length}</div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {rename.renaming ? (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); rename.commitRename(); }}
              className="flex-1 rounded-xl gradient-primary py-2.5 text-xs font-semibold text-primary-foreground"
            >
              Done
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); rename.cancelRename(); }}
              className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs text-muted-foreground hover:bg-white/10"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => modpacks.selectModpack(modpack.id)}
              className="flex-1 rounded-xl gradient-primary py-2.5 text-xs font-semibold text-primary-foreground transition hover:scale-[1.02]"
            >
              Select
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); modpacks.removeModpack(modpack.id); }}
              className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-muted-foreground hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
              title="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ----------------------------- Login Modal ----------------------------- */

function LoginModal({ onDone, onClose }: { onDone: (s: SessionResult) => void; onClose: () => void }) {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayMode, setDisplayMode] = useState<"prefix" | "custom">("prefix");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [avail, setAvail] = useState<{ available: boolean; mojangMatch: unknown } | null>(null);

  const displayName = displayMode === "prefix" ? `C_${username}` : username;

  const handleCheck = async () => {
    if (!username) return;
    setError("");
    setAvail(null);
    try {
      const r = await checkAvailability(displayName);
      setAvail(r);
      if (!r.available) {
        if (displayMode === "custom") setDisplayMode("prefix");
        else setError("Display name taken");
      }
    } catch { setError("Check failed"); }
  };

  const handleSubmit = async () => {
    setError("");
    if (!email || !password || (tab === "signup" && !username)) { setError("Fill all fields"); return; }
    setLoading(true);
    try {
      const result = tab === "signup"
        ? await signup(email, username, displayName, password)
        : await login(email, password);
      onDone(result);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-strong w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl"
      >
        <div className="flex border-b border-white/5">
          <button
            onClick={() => setTab("signin")}
            className={`flex-1 py-3 text-center text-sm font-semibold transition ${tab === "signin" ? "text-foreground border-b-2 border-primary" : "text-muted-foreground"}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab("signup")}
            className={`flex-1 py-3 text-center text-sm font-semibold transition ${tab === "signup" ? "text-foreground border-b-2 border-primary" : "text-muted-foreground"}`}
          >
            Create Account
          </button>
        </div>

        <div className="space-y-4 p-6">
          {tab === "signup" && (
            <>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary/40" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Username</label>
                <input value={username} onChange={(e) => { setUsername(e.target.value); setAvail(null); }} placeholder="Steve" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary/40" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Display Name</label>
                <div className="flex gap-2">
                  <button onClick={() => setDisplayMode("prefix")} className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition ${displayMode === "prefix" ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground"}`}>C_ prefix</button>
                  <button onClick={() => setDisplayMode("custom")} className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition ${displayMode === "custom" ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground"}`}>Custom name</button>
                </div>
                <div className="mt-1.5 text-xs text-muted-foreground">
                  In-game name: <span className="font-mono text-foreground">{displayName || "—"}</span>
                  {displayMode === "prefix" && <span className="ml-1 text-[10px] text-muted-foreground/50">(avoids Mojang collision)</span>}
                </div>
              </div>
              {displayName && (displayMode === "custom") && (
                <button onClick={handleCheck} disabled={loading} className="w-full rounded-xl border border-white/10 px-3 py-2 text-xs font-medium transition hover:bg-white/5 disabled:opacity-50">
                  Check availability
                </button>
              )}
              {avail && (
                <div className={`text-xs ${avail.available ? "text-emerald-400" : "text-rose-400"}`}>
                  {avail.available ? "Name available!" : "Name taken — switched to prefix mode"}
                </div>
              )}
            </>
          )}

          {tab === "signin" && (
            <>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary/40" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Password</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary/40" />
              </div>
            </>
          )}

          {tab === "signup" && (
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Password</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary/40" />
            </div>
          )}

          {error && <div className="text-xs text-rose-400">{error}</div>}

          <button onClick={handleSubmit} disabled={loading} className="w-full rounded-xl gradient-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
            {loading ? "Please wait…" : tab === "signup" ? "Create Account" : "Sign In"}
          </button>

          <button onClick={onClose} className="w-full text-xs text-muted-foreground transition hover:text-foreground">
            Continue without account
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function CrestLauncherInner() {
  const [active, setActive] = useState<NavId>("home");
  const profiles = useOfflineProfiles();
  const modpacks = useModpacks();
  const [session, setSession] = useState<SessionResult | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [gameRunning, setGameRunning] = useState(false);
  const [launchStep, setLaunchStep] = useState(0);
  const [backendOnline, setBackendOnline] = useState(false);
  const [launchSteps] = useState([
    "Locating Java runtime…",
    "Downloading Minecraft version…",
    "Installing Fabric loader…",
    "Assembling libraries…",
    "Preparing game directory…",
    "Launching game…",
    "Waiting for window…",
    "Game running!",
  ]);

  useEffect(() => {
    if (!launching) { setLaunchStep(0); return; }
    if (launchStep >= launchSteps.length - 1) return;
    const t = setTimeout(() => setLaunchStep((s) => s + 1), Math.random() * 1500 + 600);
    return () => clearTimeout(t);
  }, [launching, launchStep, launchSteps.length]);

  useEffect(() => {
    if (!gameRunning) return;
    const id = setInterval(async () => {
      try {
        const s = await fetchGameStatus();
        if (!s.alive) setGameRunning(false);
      } catch { setGameRunning(false); }
    }, 2000);
    return () => clearInterval(id);
  }, [gameRunning]);

  useEffect(() => {
    fetchSession().then((s) => {
      if (s && "jwt" in s) setSession(s as SessionResult);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let dead = false;
    let pending = false;
    const check = async () => {
      if (pending) return;
      pending = true;
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 3000);
        const res = await fetch(`${API_BASE}/health`, { signal: ctrl.signal });
        clearTimeout(t);
        if (!dead) setBackendOnline(res.ok);
      } catch {
        if (!dead) setBackendOnline(false);
      }
      pending = false;
    };
    check();
    const id = setInterval(check, 5000);
    return () => { dead = true; clearInterval(id); };
  }, []);

  const handleCancel = async () => {
    try { await killGame(); } catch {}
    setLaunching(false);
    setGameRunning(false);
  };

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
          <TopBar profiles={profiles} modpacks={modpacks} launching={launching} gameRunning={gameRunning} setGameRunning={setGameRunning} session={session} backendOnline={backendOnline} onLoginClick={() => setShowLoginModal(true)} onLogout={() => { apiLogout().catch(() => {}); setSession(null); }} />
          <main className="flex-1 px-8 pb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                {active === "home" && <HomeView profiles={profiles} modpacks={modpacks} launching={launching} setLaunching={setLaunching} gameRunning={gameRunning} setGameRunning={setGameRunning} session={session} />}
                {active === "versions" && <VersionsView modpacks={modpacks} />}
                {active === "modpacks" && <ModpacksView modpacks={modpacks} />}
                {active === "mods" && <ModsView modpacks={modpacks} />}
                {active === "servers" && <ServersView launching={launching} setLaunching={setLaunching} gameRunning={gameRunning} setGameRunning={setGameRunning} session={session} />}
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

      {showLoginModal && (
        <LoginModal
          onDone={(s) => { setSession(s as SessionResult); setShowLoginModal(false); }}
          onClose={() => setShowLoginModal(false)}
        />
      )}
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
  launching,
  gameRunning,
  setGameRunning,
  session,
  backendOnline,
  onLoginClick,
  onLogout,
}: {
  profiles: ReturnType<typeof useOfflineProfiles>;
  modpacks: ReturnType<typeof useModpacks>;
  launching: boolean;
  gameRunning: boolean;
  setGameRunning: (v: boolean) => void;
  session: SessionResult | null;
  backendOnline: boolean;
  onLoginClick: () => void;
  onLogout: () => void;
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
            {modpacks.activeModpack.mcVersion} · {modpacks.activeModpack.loaderType}
          </span>
        </div>
      )}

      {/* API status */}
      <span className="glass flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px]">
        <span className={`h-1.5 w-1.5 rounded-full ${backendOnline ? "bg-emerald-400" : "bg-rose-400"}`} />
        <span className={backendOnline ? "text-emerald-400" : "text-rose-400"}>
          {backendOnline ? "API" : "API off"}
        </span>
      </span>

      {/* Profile selector */}
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
            {session
              ? initials(session.account.display_name)
              : "?"}
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold leading-tight">
              {session ? session.account.display_name : "Not signed in"}
            </div>
            <div className={`text-[10px] ${session ? "text-emerald-400" : "text-muted-foreground"}`}>
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
            >
              {session ? (
                <>
                  <div className="border-b border-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">
                        {initials(session.account.display_name)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{session.account.display_name}</div>
                        <div className="text-[11px] text-muted-foreground">Crest Account</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => { apiLogout(); setProfileOpen(false); window.location.reload(); }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-white/5"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-4 space-y-2">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Account</div>
                  <button
                    onClick={() => { setProfileOpen(false); onLoginClick(); }}
                    className="flex w-full items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    Sign in / Create account
                  </button>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Sign in to use your Crest account across devices with a persistent identity and UUID.
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

/* -------------------------------- Home -------------------------------- */

function HomeView({
  profiles,
  modpacks,
  launching,
  setLaunching,
  gameRunning,
  setGameRunning,
  session,
}: {
  profiles: ReturnType<typeof useOfflineProfiles>;
  modpacks: ReturnType<typeof useModpacks>;
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
      await launchGame(installedId, Number(ram) * 1024, active.name, session?.account?.id);
      setProgress(100);
      setGameRunning(true);
      setLaunching(false);
    } catch (err) {
      if (err instanceof TypeError && (err.message === "Failed to fetch" || err.message.includes("fetch"))) {
        setLaunchError("API unreachable — make sure the backend is running (scripts/dev.sh)");
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
          <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${session ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-muted-foreground"}`}>
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
          <div className="mx-auto max-w-xl">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Modpacks</div>
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
                className={`glass flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left transition ${
                  homeSelectorOpen ? "ring-2 ring-primary/40" : "hover:bg-white/[0.04]"
                }`}
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl gradient-primary">
                  <Boxes className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-base font-semibold">{active!.name}</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{active!.mcVersion}</span>
                    <span>·</span>
                    <span className={active!.loaderType === "fabric" ? "text-violet-400" : "text-sky-400"}>
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
                            onClick={() => { modpacks.selectModpack(mp.id); setHomeSelectorOpen(false); }}
                            className={`flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left transition ${
                              isActive ? "bg-primary/15 ring-1 ring-primary/30" : "hover:bg-white/5"
                            }`}
                          >
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl gradient-primary">
                              <Boxes className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="truncate text-sm font-semibold">{mp.name}</div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span>{mp.mcVersion}</span>
                                <span>·</span>
                                <span className={mp.loaderType === "fabric" ? "text-violet-400" : "text-sky-400"}>
                                  {mp.loaderType === "fabric" ? "Fabric" : "Vanilla"}
                                </span>
                              </div>
                            </div>
                            {isActive && <Check className="h-5 w-5 shrink-0 text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Launch button */}
        {active && (
          <>
            <button
              onClick={handleLaunch}
              disabled={launching || gameRunning || !profiles.activeProfile}
              className="group relative mx-auto mt-8 flex h-20 w-20 items-center justify-center rounded-full gradient-primary text-primary-foreground shadow-[var(--shadow-glow)] transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Launch game"
            >
              <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/20" />
              {!launching && (
                <span className="pointer-events-none absolute inset-0 rounded-full animate-pulse-ring border border-primary/50" />
              )}
              {launching ? (
                <span className="font-mono text-xs font-semibold">{progress}%</span>
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
          if (result) {
            // best-effort: create instance folder structure on disk
            createInstance(name, mcVersion, loaderType).catch(() => {});
            setShowCreateModpack(false);
          }
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
  icon_url?: string;
  categories: string[];
  versions: string[];
};

function ModsView({ modpacks }: { modpacks: ReturnType<typeof useModpacks> }) {
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
  const [untracked, setUntracked] = useState<{filename: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [browseSection, setBrowseSection] = useState<"popular"|"pvp"|"optimization"|"utility"|"magic"|"combat"|"search">("popular");

  const BROWSE_SECTIONS = useMemo(() => [
    { id: "popular" as const, label: "Popular", categories: "" },
    { id: "pvp" as const, label: "PvP", categories: "pvp" },
    { id: "optimization" as const, label: "Optimization", categories: "optimization" },
    { id: "utility" as const, label: "Utility", categories: "utility" },
    { id: "magic" as const, label: "Magic", categories: "magic" },
    { id: "combat" as const, label: "Combat", categories: "combat" },
  ], []);

  const doBrowseFetch = useCallback(async (section: typeof browseSection) => {
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
    } catch { setSearchResults([]); }
    setSearching(false);
  }, [active?.mcVersion, BROWSE_SECTIONS]);

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
    } catch {}
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
        .then((d) => { if (d.icon_url) setModIcons((prev) => ({ ...prev, [m.slug]: d.icon_url })); })
        .catch(() => {});
    }
  }, [installedMods, modIcons]);

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
        action={
          active ? (
            <div className="flex items-center gap-2">
              <button onClick={loadMods} disabled={loading} className="glass flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs transition hover:bg-white/10 disabled:opacity-50">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Reload
              </button>
              <div className="relative">
                <button
                  onClick={() => setSelectorOpen(!selectorOpen)}
                  className={`glass flex items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-white/10 ${selectorOpen ? "ring-2 ring-primary" : ""}`}
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg gradient-primary">
                    <Boxes className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold leading-tight">{active.name}</div>
                    <div className="text-[10px] text-muted-foreground">{active.mcVersion} · {active.loaderType === "fabric" ? "Fabric" : "Vanilla"}</div>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>
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
                              onClick={() => { modpacks.selectModpack(mp.id); setSelectorOpen(false); }}
                              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                                isActive ? "bg-primary/15 ring-1 ring-primary/30" : "hover:bg-white/5"
                              }`}
                            >
                              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg gradient-primary">
                                <Boxes className="h-4 w-4 text-primary-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="truncate text-xs font-semibold">{mp.name}</div>
                                <div className="text-[10px] text-muted-foreground">{mp.mcVersion} · {mp.loaderType === "fabric" ? "Fabric" : "Vanilla"}</div>
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
              <button
                onClick={() => openModsFolder(active.name)}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium transition hover:bg-white/10"
              >
                <Folder className="h-3.5 w-3.5" /> Open Folder
              </button>
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
                    <p className="text-sm">No mods installed yet. Switch to Browse to search Modrinth.</p>
                  </div>
                ) : (
                  <>
                    {installedMods.length > 0 && (
                      <div>
                        <div className="mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                          Installed ({installedMods.length})
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {installedMods.map((m) => (
                            <div key={m.slug} className="glass flex items-center gap-4 rounded-2xl p-4">
                              {modIcons[m.slug] ? (
                                <img src={modIcons[m.slug]} className="h-10 w-10 shrink-0 rounded-xl object-cover" />
                              ) : (
                                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-primary">
                                  <Shield className="h-5 w-5 text-primary-foreground" />
                                </div>
                              )}
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

                    {untracked.length > 0 && (
                      <div>
                        <div className="mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                          Manually added ({untracked.length}) <span className="text-[9px] text-muted-foreground/50">— .jar files in mods folder not tracked in profile</span>
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {untracked.map((u) => (
                            <div key={u.filename} className="glass flex items-center gap-4 rounded-2xl p-4">
                              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5">
                                <Shield className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="truncate text-sm font-semibold">{u.filename}</div>
                                <div className="text-xs text-muted-foreground">Manual install</div>
                              </div>
                              <button
                                onClick={async () => {
                                  if (!active) return;
                                  try {
                                    await adoptMod(active.name, u.filename);
                                    loadMods();
                                  } catch {}
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
                {/* Section buttons */}
                <div className="flex flex-wrap gap-2">
                  {BROWSE_SECTIONS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setBrowseSection(s.id)}
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                        browseSection === s.id
                          ? "gradient-primary text-primary-foreground shadow"
                          : "glass text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setBrowseSection("search")}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition ${
                      browseSection === "search"
                        ? "gradient-primary text-primary-foreground shadow"
                        : "glass text-muted-foreground hover:text-foreground"
                    }`}
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
                      placeholder={`Search Modrinth for ${active.mcVersion} Fabric mods…`}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                    {searching && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  </div>
                )}

                {searching && searchResults.length === 0 && (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}

                {!searching && searchResults.length === 0 && browseSection === "search" && !query.trim() && (
                  <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                    <Search className="h-10 w-10 opacity-30" />
                    <p className="text-sm">Type a query to search Modrinth.</p>
                  </div>
                )}

                {!searching && searchResults.length === 0 && browseSection === "search" && query.trim() && (
                  <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                    <Search className="h-10 w-10 opacity-30" />
                    <p className="text-sm">No results found for "{query}".</p>
                  </div>
                )}

                {!searching && searchResults.length === 0 && browseSection !== "search" && (
                  <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                    <Shield className="h-10 w-10 opacity-30" />
                    <p className="text-sm">No mods found in this category.</p>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div>
                    <div className="mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                      {browseSection === "search" ? `Results for "${query}"` : BROWSE_SECTIONS.find((s) => s.id === browseSection)?.label ?? "Mods"}
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
                              {m.icon_url ? (
                                <img src={m.icon_url} className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                              ) : (
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl gradient-primary">
                                  <Shield className="h-6 w-6 text-primary-foreground" />
                                </div>
                              )}
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

          {/* Right sidebar tabs */}
          <div className="glass flex shrink-0 flex-col gap-1 rounded-2xl p-1">
            <button
              onClick={() => setModsTab("installed")}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                modsTab === "installed" ? "gradient-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Installed{installedMods.length > 0 ? ` (${installedMods.length})` : ""}
            </button>
            <button
              onClick={() => setModsTab("browse")}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                modsTab === "browse" ? "gradient-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Browse
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Servers ------------------------------- */

function ServersView({
  launching,
  setLaunching,
  gameRunning,
  setGameRunning,
  session,
}: {
  launching: boolean;
  setLaunching: (v: boolean) => void;
  gameRunning: boolean;
  setGameRunning: (v: boolean) => void;
  session: SessionResult | null;
}) {
  const [serversList, setServersList] = useState<ServerEntry[]>([]);
  const [pings, setPings] = useState<Record<string, number | null>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddr, setNewAddr] = useState("");
  const [loading, setLoading] = useState(true);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const profiles = useOfflineProfiles();
  const modpacks = useModpacks();

  const refresh = useCallback(async () => {
    try { setServersList(await fetchServers()); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleAdd = async () => {
    if (!newName.trim() || !newAddr.trim()) return;
    try {
      await addServer(newName.trim(), newAddr.trim());
      setNewName("");
      setNewAddr("");
      setShowAdd(false);
      refresh();
    } catch {}
  };

  const handleRemove = async (addr: string) => {
    try { await removeServer(addr); refresh(); } catch {}
  };

  const handlePing = async (addr: string) => {
    try {
      const r = await pingServer(addr);
      setPings((prev) => ({ ...prev, [addr]: r.ping_ms }));
    } catch {
      setPings((prev) => ({ ...prev, [addr]: null }));
    }
  };

  const handleRename = async (addr: string) => {
    if (renameVal.trim() && renameVal !== serversList.find((s) => s.address === addr)?.name) {
      await removeServer(addr);
      await addServer(renameVal.trim(), addr);
      refresh();
    }
    setRenameId(null);
  };

  const handleJoin = async (addr: string) => {
    if (launching || gameRunning) return;
    const active = modpacks.activeModpack;
    if (!active || !profiles.activeProfile) return;
    setLaunching(true);
    try {
      await installVersion(active.mcVersion, active.loaderType);
      await launchGame(active.mcVersion, 4096, active.name, session?.account?.id, undefined, addr);
      setGameRunning(true);
    } catch {}
    setLaunching(false);
  };

  return (
    <div className="space-y-6">
      <Header
        title="Servers"
        subtitle="Your saved servers — add, ping, and join directly."
        action={
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 rounded-full gradient-primary px-4 py-2 text-xs font-medium text-primary-foreground"
          >
            <Plus className="h-3 w-3" /> Add Server
          </button>
        }
      />

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass flex items-end gap-3 rounded-2xl p-4">
              <div className="flex-1">
                <div className="mb-1 text-xs text-muted-foreground">Server Name</div>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  placeholder="My SMP"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                />
              </div>
              <div className="flex-1">
                <div className="mb-1 text-xs text-muted-foreground">Address</div>
                <input
                  value={newAddr}
                  onChange={(e) => setNewAddr(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  placeholder="mc.example.com:25565"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none font-mono"
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={!newName.trim() || !newAddr.trim()}
                className="rounded-xl gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading servers…
        </div>
      ) : serversList.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <ServerIcon className="h-12 w-12 opacity-30" />
          <p className="text-sm">No servers yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {serversList.map((s) => {
            const ping = pings[s.address];
            const pingStyle = ping != null
              ? ping < 50 ? "text-emerald-400"
                : ping < 100 ? "text-amber-400"
                : "text-rose-400"
              : "text-muted-foreground";
            const isRenaming = renameId === s.address;
            return (
              <motion.div
                key={s.address}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass flex items-center gap-5 rounded-2xl p-5"
              >
                <div className="grid h-14 w-14 place-items-center rounded-xl gradient-primary">
                  <ServerIcon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  {isRenaming ? (
                    <input
                      value={renameVal}
                      onChange={(e) => setRenameVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(s.address);
                        if (e.key === 'Escape') setRenameId(null);
                      }}
                      onBlur={() => handleRename(s.address)}
                      className="w-full rounded-md border border-white/20 bg-white/5 px-2 py-0.5 font-display text-lg font-semibold outline-none"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg font-semibold">{s.name}</span>
                      <button
                        onClick={() => { setRenameId(s.address); setRenameVal(s.name); }}
                        className="rounded-lg p-1 text-muted-foreground hover:bg-white/10"
                        title="Rename"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">{s.address}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Ping</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePing(s.address)}
                      className="rounded-lg bg-white/5 p-1.5 text-xs hover:bg-white/10"
                      title="Ping"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </button>
                    <span className={`font-mono text-sm font-semibold ${pingStyle}`}>
                      {ping != null ? `${ping} ms` : "—"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleJoin(s.address)}
                  disabled={launching || gameRunning}
                  className="flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {launching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : gameRunning ? (
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                    </span>
                  ) : (
                    <Play className="h-4 w-4 fill-current" />
                  )} {launching ? "Launching…" : gameRunning ? "Playing" : "Join"}
                </button>
                <button
                  onClick={() => handleRemove(s.address)}
                  className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-muted-foreground hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
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
  const [entries, setEntries] = useState<CrashEntry[]>([]);
  const [selected, setSelected] = useState<CrashEntry | null>(null);
  const [tab, setTab] = useState<"game" | "launcher">("game");
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<"all" | CrashEntry["severity"]>("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/logs`);
      const data: CrashEntry[] = await res.json();
      setEntries(data);
      setSelected((s) => (s ? data.find((e) => e.id === s.id) ?? data[0] : data[0]));
    } catch {
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const list =
    filter === "all"
      ? entries
      : entries.filter((c) => c.severity === filter);
  const active = list.includes(selected as CrashEntry) ? (selected as CrashEntry) : (list[0] ?? null);
  const logText = active ? (tab === "game" ? active.gameLog : active.launcherLog) : "";

  const copy = async () => {
    if (!active) return;
    try {
      await navigator.clipboard.writeText(logText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };

  const openFolder = () => {
    fetch(`${API_BASE}/logs/open-folder`);
  };

  return (
    <div className="space-y-6">
      <Header
        title="Crash Logs"
        subtitle="Every failed launch is captured here — inspect stack traces, compare launcher and game logs, and share."
        action={
          <div className="flex items-center gap-2">
            <button onClick={openFolder} className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium hover:bg-white/10">
              <Folder className="h-3.5 w-3.5" /> Open folder
            </button>
            <button onClick={load} disabled={loading} className="flex items-center gap-1.5 rounded-full gradient-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
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

      {!active ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="text-lg font-semibold text-muted-foreground">No crash logs yet</div>
          <div className="mt-1 text-sm text-muted-foreground/60">Crash reports will appear here after a failed launch.</div>
        </div>
      ) : (<div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,320px)_1fr]">
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
      </div>)}
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
  const { openCreateModal, createModal } = useModpackCreateModal(mp);

  const filtered = mp.modpacks.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <Header
        title="Modpacks"
        subtitle="Your modpacks — launch-ready configurations with version and loader settings."
        action={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-full gradient-primary px-4 py-2 text-xs font-medium text-primary-foreground"
          >
            <Plus className="h-3 w-3" /> Create Modpack
          </button>
        }
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

      {filtered.length === 0 && mp.modpacks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
          <Boxes className="h-12 w-12 opacity-30" />
          <p className="text-sm">No modpacks yet. Create one above or from the Home tab.</p>
        </div>
      ) : (
        <>
          {mp.modpacks.length > 0 && (
            <>
              <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Your Modpacks</div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((m) => (
                  <ModpackCard key={m.id} modpack={m} modpacks={mp} />
                ))}
              </div>
            </>
          )}
          <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Featured</div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {staticModpacks.map((m) => (
              <motion.div
                key={m.id}
                whileHover={{ y: -4 }}
                className="glass group relative flex items-start gap-4 overflow-hidden rounded-2xl p-5"
              >
                {m.icon ? (
                  <img src={m.icon} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl gradient-primary">
                    <Boxes className="h-7 w-7 text-primary-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-base font-semibold">{m.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{m.author}</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px]">{m.mcVersion}</span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px]">{m.loader}</span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px]">{m.size}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {createModal}
    </div>
  );
}
