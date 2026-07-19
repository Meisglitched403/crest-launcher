import { ViewHeader, SectionRow, GhostButton, Chip } from "../parts";
import { useTheme } from "@/components/launcher/ThemeCustomizer";
import { Moon, Sun, Monitor, FileJson, Copy, Sparkles } from "lucide-react";

const KVD = (k: string, v: string) => (
  <span className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-xs">
    <span className="text-muted-foreground">{k}</span>
    <span className="font-mono text-foreground/80">{v}</span>
  </span>
);

export function SettingsView() {
  const { resolvedMode, setMode, motion } = useTheme();

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Settings"
        subtitle="Personalize Crest to your taste and your system."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Appearance */}
        <div className="glass-elev-2 rounded-2xl p-6">
          <div className="mb-5 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-display text-sm font-semibold">Appearance</h2>
          </div>
          <div className="mb-4">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Theme Mode</div>
            <div className="grid grid-cols-3 gap-1.5">
              {(["dark", "light", "system"] as const).map((m) => {
                const activeM = resolvedMode === m || (m === "system" && resolvedMode === "dark");
                return (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-medium transition ${
                      activeM ? "border-primary/50 bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:bg-white/5"
                    }`}
                  >
                    {m === "dark" ? <Moon className="h-3.5 w-3.5" /> : m === "light" ? <Sun className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}
                    {m === "dark" ? "Dark" : m === "light" ? "Light" : "Auto"}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <SectionRow label="Active Palette" />
            <Chip tone="default">{resolvedMode === "dark" ? "Nocturne · Dark" : "Frost · Light"}</Chip>
            <div className="mt-3 text-[10px] text-muted-foreground">
              Motion: <span className="text-foreground/70">×{motion === 0 ? 0 : motion === 1 ? 0.6 : motion === 3 ? 1.35 : 1.0}</span>
            </div>
          </div>
        </div>

        {/* About / Backend */}
        <div className="glass-elev-2 rounded-2xl p-6">
          <div className="mb-5 flex items-center gap-2">
            <FileJson className="h-4 w-4 text-primary" />
            <h2 className="font-display text-sm font-semibold">About & Backend</h2>
          </div>
          <div className="space-y-1.5">
            {KVD("Version", "3.2.0")}
            {KVD("Build", "2026.07.14")}
            {KVD("Java", "21.0.4 LTS")}
            {KVD("OS", "Linux · x64")}
            {KVD("Backend", "Python · port 8765")}
          </div>
          <GhostButton
            onClick={() => navigator.clipboard.writeText("http://127.0.0.1:8765").catch(() => {})}
            className="mt-3 w-full"
            icon={<Copy className="h-3.5 w-3.5" />}
          >
            Copy backend URL
          </GhostButton>
          <button
            onClick={() => window.open("https://github.com/Meisglitched403/crest-launcher", "_blank")}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
          >
            Open on GitHub →
          </button>
        </div>

        {/* Theme details */}
        <div className="glass-elev-2 rounded-2xl p-6">
          <div className="mb-5 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-display text-sm font-semibold">Theme Details</h2>
          </div>
          <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
            <p>Open the Theme Customizer (palette icon in the top bar) to pick a mode, accent color, glass level, font scale, and motion preset.</p>
            <p>Glass levels: <span className="text-foreground/70">Solid / Subtle / Default / Heavy</span>.</p>
            <p>Font scales: <span className="text-foreground/70">Compact / Comfortable / Cozy / Large</span>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
