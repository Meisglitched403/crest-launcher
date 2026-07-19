import { motion } from "framer-motion";
import { ViewHeader, EmptyState } from "../parts";
import { Plus, MessageCircle, UserRoundPlus } from "lucide-react";
import type { ViewProps } from "../lib/types";

const friends = [
  { name: "Notch", status: "In-game — Hypixel Bedwars", online: true, avatar: "N" },
  { name: "Dream", status: "Idle in launcher", online: true, avatar: "D" },
  { name: "Technoblade", status: "In-game — SkyBlock", online: true, avatar: "T" },
  { name: "Grian", status: "Offline · 3h ago", online: false, avatar: "G" },
  { name: "Pearlescent", status: "Offline · yesterday", online: false, avatar: "P" },
];

export function FriendsView(_p: ViewProps) {
  const online = friends.filter((f) => f.online).length;
  return (
    <div className="space-y-6">
      <ViewHeader
        title="Friends"
        subtitle={`${friends.length} friends · ${online} online`}
        action={
          <span className="text-[11px] text-muted-foreground">
            Party up, join their world, or challenge them.
          </span>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {friends.map((f, i) => {
          const delay = i * 0.03;
          return (
            <motion.div
              key={f.name}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay, duration: 0.25, ease: "easeOut" }}
              whileHover={{ y: -4 }}
              className="glass flex items-center gap-4 rounded-2xl p-4 transition"
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="grid h-12 w-12 place-items-center rounded-full gradient-primary font-display text-base font-bold text-primary-foreground shadow-[0_0_16px_oklch(0.74_0.17_152_/_0.4)]">
                  {f.avatar}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background ${
                    f.online ? "bg-emerald-400 shadow-[0_0_8px_oklch(0.7_0.17_155_/_0.8)]" : "bg-slate-600"
                  }`}
                />
              </div>
              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{f.name}</div>
                <div className={`truncate text-xs ${f.online ? "text-muted-foreground" : "text-slate-500"}`}>{f.status}</div>
              </div>
              {/* Actions */}
              {f.online ? (
                <div className="flex gap-1.5 shrink-0">
                  <span className="grid h-8 w-8 place-items-center rounded-xl border border-white/8 bg-white/5 text-muted-foreground transition hover:bg-white/10 hover:text-foreground">
                    <MessageCircle className="h-3.5 w-3.5" />
                  </span>
                  <span className="grid h-8 w-8 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-[0_4px_12px_-4px_oklch(0.74_0.17_152_/_0.5)] transition hover:scale-105">
                    <UserRoundPlus className="h-3.5 w-3.5" />
                  </span>
                </div>
              ) : (
                <div className="h-8 w-8 shrink-0 rounded-xl border border-white/[0.06] bg-white/[0.02]" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}