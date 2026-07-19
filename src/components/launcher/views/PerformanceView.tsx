import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ViewHeader } from "../parts";

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

interface TelemetryPoint {
  t: number;
  fps: number;
  gpu: number;
  vram: number;
  frameTime: number;
}

function generatePoint(prev: TelemetryPoint | null, t: number): TelemetryPoint {
  const base = prev ?? { fps: 480, gpu: 45, vram: 32, frameTime: 2.0 };
  return {
    t,
    fps: Math.max(60, Math.min(600, base.fps + (Math.random() - 0.5) * 40)),
    gpu: Math.max(5, Math.min(100, base.gpu + (Math.random() - 0.5) * 8)),
    vram: Math.max(10, Math.min(80, base.vram + (Math.random() - 0.5) * 2)),
    frameTime: Math.max(0.5, Math.min(16, base.frameTime + (Math.random() - 0.5) * 0.6)),
  };
}

const MAX_POINTS = 60;

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-elev-3 rounded-xl px-3 py-2 text-xs">
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${p.name === "fps" ? "bg-emerald-400" : p.name === "gpu" ? "bg-violet-400" : "bg-cyan-400"}`} />
          <span className="text-muted-foreground capitalize">{p.name === "frameTime" ? "Frame Time" : p.name}</span>
          <span className="font-mono font-medium">
            {p.name === "fps" ? `${Math.round(p.value)} FPS` : p.name === "frameTime" ? `${p.value.toFixed(1)} ms` : `${Math.round(p.value)}%`}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PerformanceView() {
  const [preset, setPreset] = useState("Balanced");
  const [editMode, setEditMode] = useState(false);
  const [flags, setFlags] = useState(JVM_FLAGS);
  const [data, setData] = useState<TelemetryPoint[]>(() => {
    const now = Date.now();
    const points: TelemetryPoint[] = [];
    for (let i = MAX_POINTS; i > 0; i--) {
      points.push(generatePoint(points[points.length - 1] ?? null, now - i * 1000));
    }
    return points;
  });
  const tickRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    tickRef.current = setInterval(() => {
      setData((prev) => {
        const next = [...prev, generatePoint(prev[prev.length - 1], Date.now())];
        return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  const latest = data[data.length - 1];

  const TELEMETRY = [
    { l: "FPS", v: `${Math.round(latest.fps)}`, max: "600", pct: (latest.fps / 600) * 100, c: "bg-emerald-400" },
    { l: "Frame time", v: `${latest.frameTime.toFixed(1)} ms`, max: "16.6 ms", pct: (latest.frameTime / 16.6) * 100, c: "bg-cyan-400" },
    { l: "GPU Usage", v: `${Math.round(latest.gpu)}%`, max: "100%", pct: latest.gpu, c: "bg-violet-400" },
    { l: "VRAM", v: `${(latest.vram / 10).toFixed(1)} GB`, max: "12 GB", pct: latest.vram, c: "bg-fuchsia-400" },
  ];

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Performance"
        subtitle="Tune the launcher and JVM for your rig."
      />

      {/* Preset grid */}
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
        {/* Live Telemetry chart */}
        <div className="glass rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="font-display text-sm font-semibold">Live Telemetry</div>
            <div className="flex gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> FPS</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-violet-400" /> GPU</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Frame Time</span>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradFps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradGpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradFt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="t" hide />
                <YAxis domain={[0, 600]} hide />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="fps" stroke="#34d399" fill="url(#gradFps)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Area type="monotone" dataKey="gpu" stroke="#a78bfa" fill="url(#gradGpu)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Area type="monotone" dataKey="frameTime" stroke="#22d3ee" fill="url(#gradFt)" strokeWidth={1.5} dot={false} isAnimationActive={false} yAxisId={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Compact stat bars below chart */}
          <div className="mt-4 space-y-3">
            {TELEMETRY.map((row) => (
              <div key={row.l}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">{row.l}</span>
                  <span className="font-mono">
                    {row.v} <span className="text-muted-foreground">/ {row.max}</span>
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${row.pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`h-full ${row.c}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

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
      </div>
    </div>
  );
}
