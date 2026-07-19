import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { X, UserPlus } from "lucide-react";
import { logout as apiLogout } from "@/lib/tauri-commands";
import { ThemeProvider, ThemeTrigger } from "./ThemeCustomizer";
import { AppSidebar, AppTopbar, AmbientBackground, PageTransition } from "./layout";
import { CommandPalette } from "./modals/CommandPalette";
import { HomeView } from "./views/HomeView";
import { VersionsView } from "./views/VersionsView";
import { ModpacksView } from "./views/ModpackCard";
import { ModsView } from "./views/ModsView";
import { ServersView } from "./views/ServersView";
import { CosmeticsView } from "./views/CosmeticsView";
import { PerformanceView } from "./views/PerformanceView";
import { CrashLogsView } from "./views/CrashesView";
import { FriendsView } from "./views/FriendsView";
import { NewsView } from "./views/NewsView";
import { StatsView } from "./views/StatsView";
import { SettingsView } from "./views/SettingsView";
import { LoginModal } from "./modals/LoginModal";
import { CreateModpackModal } from "./modals/CreateModpackModal";
import { useOfflineProfiles } from "@/hooks/use-offline-profiles";
import { useModpacks } from "@/hooks/use-modpacks";
import type { SessionResult } from "@/lib/tauri-commands";
import type { NavId } from "./layout";

export function CrestLauncher() {
  const profiles = useOfflineProfiles();
  const modpacks = useModpacks();
  const [active, setActive] = useState<NavId>("home");
  const [session, setSession] = useState<SessionResult | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [gameRunning, setGameRunning] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  // Global ⌘K / Ctrl+K handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    fetch("http://127.0.0.1:8765/api/health", { signal: new AbortController().signal })
      .catch(() => {})
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
    const id = setInterval(() => {
      fetch("http://127.0.0.1:8765/api/health", { signal: new AbortController().signal })
        .then(() => setBackendOnline(true))
        .catch(() => setBackendOnline(false));
    }, 8000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetch("http://127.0.0.1:8765/api/accounts/session")
      .then((r) => r.json())
      .then((s) => { if (s && "jwt" in s) setSession(s as SessionResult); })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    apiLogout().catch(() => {});
    setSession(null);
  };

  const handleLaunch = useCallback(() => {
    setLaunching(true);
    // Simulated launch — real impl lives in HomeView
    setTimeout(() => {
      setLaunching(false);
      setGameRunning(true);
    }, 3000);
  }, []);

  return (
    <ThemeProvider>
      <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
        <AmbientBackground />
        <div className="flex min-h-screen">
          <AppSidebar active={active} setActive={setActive} />
          <div className="flex min-h-screen flex-1 flex-col">
            <AppTopbar
              profiles={profiles}
              modpacks={modpacks}
              launching={launching}
              gameRunning={gameRunning}
              setGameRunning={setGameRunning}
              session={session}
              backendOnline={backendOnline}
              onLoginClick={() => setShowLoginModal(true)}
              onLogout={handleLogout}
              onCommandOpen={() => setCommandOpen(true)}
            />
            <main className="flex-1 px-8 pb-8">
              <PageTransition active={active}>
                {active === "home" && (
                  <HomeView
                    profiles={profiles}
                    modpacks={modpacks}
                    launching={launching}
                    setLaunching={setLaunching}
                    gameRunning={gameRunning}
                    setGameRunning={setGameRunning}
                    session={session}
                  />
                )}
                {active === "versions" && <VersionsView modpacks={modpacks} />}
                {active === "modpacks" && <ModpacksView modpacks={modpacks} />}
                {active === "mods" && <ModsView modpacks={modpacks} />}
                {active === "servers" && (
                  <ServersView
                    modpacks={modpacks}
                    profiles={profiles}
                    launching={launching}
                    setLaunching={setLaunching}
                    gameRunning={gameRunning}
                    setGameRunning={setGameRunning}
                    session={session}
                    backendOnline={backendOnline}
                  />
                )}
                {active === "cosmetics" && <CosmeticsView />}
                {active === "performance" && <PerformanceView />}
                {active === "crashes" && <CrashLogsView />}
                {active === "friends" && <FriendsView profiles={profiles} modpacks={modpacks} launching={launching} setLaunching={setLaunching} gameRunning={gameRunning} setGameRunning={setGameRunning} session={session} backendOnline={backendOnline} />}
                {active === "news" && <NewsView />}
                {active === "stats" && <StatsView />}
                {active === "settings" && <SettingsView />}
              </PageTransition>
            </main>
          </div>
        </div>

        <AnimatePresence>
          {showLoginModal && (
            <LoginModal
              onDone={(s) => { setSession(s as SessionResult); setShowLoginModal(false); }}
              onClose={() => setShowLoginModal(false)}
            />
          )}
        </AnimatePresence>

        <CommandPalette
          open={commandOpen}
          onClose={() => setCommandOpen(false)}
          activeNav={active}
          onNavigate={setActive}
          launching={launching}
          gameRunning={gameRunning}
          onLaunch={handleLaunch}
          onLoginClick={() => { setShowLoginModal(true); }}
          hasSession={!!session}
          onLogout={handleLogout}
        />
      </div>
    </ThemeProvider>
  );
}
