import { motion } from "framer-motion";
import { ViewHeader, SectionRow } from "../parts";

const stats = [
  { l: "Hours played", v: "1,284", sub: "+12 this week" },
  { l: "Blocks mined", v: "482k", sub: "Diamond: 214" },
  { l: "Mobs defeated", v: "38,412", sub: "Enderman: 902" },
  { l: "Deaths", v: "1,201", sub: "Mostly lava" },
  { l: "Distance walked", v: "912 km", sub: "≈ big trip" },
  { l: "Achievements", v: "94 / 122", sub: "77% complete" },
];

const weekHours = [3, 5, 2, 6, 8, 4, 7];

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

      {/* Weekly Play Time */}
      <div className="glass-elev-2 rounded-2xl p-6">
        <SectionRow label="Weekly Play Time" />
        <div className="flex h-44 items-end justify-between gap-3">
          {weekHours.map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div className="text-[10px] font-mono text-muted-foreground mb-1">{h}h</div>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: `${h * 12}%`, opacity: 1 }}
                transition={{ duration: 0.7, delay: i * 0.06, ease: "easeOut" }}
                className="w-full rounded-t-xl gradient-primary"
              />
              <div className="text-[10px] text-muted-foreground">{"MTWTFSS"[i]}</div>
            </div>
          ))}
        </div>
        {/* recharts surface ready — swap bar div for <AreaChart /> from recharts (already installed) */}
      </div>
    </div>
  );
}