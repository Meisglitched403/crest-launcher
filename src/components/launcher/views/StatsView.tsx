import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ViewHeader, SectionRow } from "../parts";

const stats = [
  { l: "Hours played", v: "1,284", sub: "+12 this week" },
  { l: "Blocks mined", v: "482k", sub: "Diamond: 214" },
  { l: "Mobs defeated", v: "38,412", sub: "Enderman: 902" },
  { l: "Deaths", v: "1,201", sub: "Mostly lava" },
  { l: "Distance walked", v: "912 km", sub: "≈ big trip" },
  { l: "Achievements", v: "94 / 122", sub: "77% complete" },
];

const weekData = [
  { day: "Mon", hours: 3 },
  { day: "Tue", hours: 5 },
  { day: "Wed", hours: 2 },
  { day: "Thu", hours: 6 },
  { day: "Fri", hours: 8 },
  { day: "Sat", hours: 4 },
  { day: "Sun", hours: 7 },
];

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-elev-3 rounded-xl px-3 py-2 text-xs">
      <div className="font-medium">{label}</div>
      <div className="text-primary font-mono">{payload[0].value}h played</div>
    </div>
  );
}

export function StatsView() {
  return (
    <div className="space-y-6">
      <ViewHeader
        title="Player Stats"
        subtitle="Your Minecraft journey, quantified."
      />

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.l}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3, ease: "easeOut" }}
            whileHover={{ y: -4 }}
            className="glass-elev-2 rounded-2xl p-5"
          >
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {s.l}
            </div>
            <div className="mt-1 font-display text-4xl font-bold text-gradient">
              {s.v}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Weekly Play Time — recharts BarChart */}
      <div className="glass-elev-2 rounded-2xl p-6">
        <SectionRow label="Weekly Play Time" />
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={1} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                unit="h"
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar
                dataKey="hours"
                fill="url(#gradBar)"
                radius={[8, 8, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-center text-[10px] text-muted-foreground">
          {weekData.reduce((s, d) => s + d.hours, 0)}h total this week
        </div>
      </div>
    </div>
  );
}
