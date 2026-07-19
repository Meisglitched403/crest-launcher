import { useState } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { ViewHeader } from "../parts";
import { useTheme } from "@/components/launcher/ThemeCustomizer";

const TELEMETRY = [
  { l: "FPS", v: "512", max: "600", pct: 86, c: "bg-emerald-400" },
  { l: "Frame time", v: "1.9 ms", max: "16.6 ms", pct: 12, c: "bg-cyan-400" },
  { l: "GPU Usage", v: "48%", max: "100%", pct: 48, c: "bg-violet-400" },
  { l: "VRAM", v: "3.2 GB", max: "12 GB", pct: 27, c: "bg-fuchsia-400" },
];

const PRESETS = [
  { name: "Battery", desc: "Cap 60 FPS · Low power · Fans quiet", color: "from-emerald-400 to-cyan-500", icon: "⚡" },
  { name: "Balanced", desc: "Adaptive · Great visuals · Smooth", color: "from-cyan-400 to-violet-500", icon: "⚖️" },
  { name: "Performance", desc: "Uncapped FPS · Max threads · Boost", color: "from-fuchsia-400 to-rose-500", icon: "🚀" },
  { name: "Cinematic", desc: "Shaders on · 4K · Ray-traced clouds", color: "from-amber-400 to-orange-500", icon: "🎬" },
];
const JVM_FLAGS = `-Xms4G -Xmx8G
-XX:+UseG1GC -XX:+ParallelRefProcEnabled
-XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions
-XX:+DisableExplicitGC -XX:+AlwaysPreTouch
-XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40
-XX:G1HeapRegionSize=8M -XX:G1ReservePercent=20
--add-modules=jdk.incubator.vector`;

export function PerformanceView() {
  const [preset, setPreset] = useState("Balanced");
  const [editMode, setEditMode] = useState(false);
  const [flags, setFlags] = useState(JVM_FLAGS);
  return (
    <div className="space-y-6">
      <ViewHeader
        title="Performance"
        subtitle="Tune the launcher and JVM for your rig."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            onClick={() => setPreset(p.name)}
            className={`glass group relative overflow-hidden rounded-2xl p-5 text-left transition ${preset === p.name ? "ring-2 ring-primary" : ""}`}
          >
            <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${p.color}`} />
            <div className="relative">
              <div className="mb-3 text-2xl">{p.icon}</div>
              <div className="font-display text-lg font-semibold">{p.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{p.desc}</div>
              {preset === p.name && (
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
                  Active
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* JVM Flags editor */}
        <div className="glass rounded-2xl p-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-display text-sm font-semibold">JVM Flags</div>
            <button
              onClick={() => setEditMode((e) => !e)}
              className={`text-[11px] font-medium ${editMode ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {editMode ? "Done" : "Edit flags →"}
            </button>
          </div>
          {editMode ? (
            <textarea
              value={flags}
              onChange={(e) => setFlags(e.target.value)}
              className="h-40 w-full rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed text-cyan-200 outline-none focus:border-primary/40"
            />
          ) : (
            <pre className="overflow-x-auto rounded-lg border border-white/5 bg-black/40 p-4 text-[11px] leading-relaxed text-cyan-200">
              {flags}
            </pre>
          )}
        </div>

        {/* Live Telemetry (recharts surface ready) */}
        <div className="glass rounded-2xl p-6">
          <div className="font-display text-sm font-semibold mb-4">Live Telemetry</div>
          <div className="space-y-4">
            {TELEMETRY.map((row) => (
              <div key={row.l}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">{row.l}</span>
                  <span className="font-mono">
                    {row.v} <span className="text-muted-foreground">/ {row.max}</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${row.pct}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className={`h-full ${row.c}`}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <span className="text-[10px] text-muted-foreground">
              Connected via backend telemetry · <span className="text-primary">recharts</span> surface ready
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}