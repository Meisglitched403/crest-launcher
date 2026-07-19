import { motion } from "framer-motion";
import { ViewHeader } from "../parts";
import { cosmetics, rarityColor, type Cosmetic } from "../data";

export function CosmeticsView() {
  return (
    <div className="space-y-6">
      <ViewHeader
        title="Cosmetics Wardrobe"
        subtitle="Wings, capes, pets, emotes and weapon skins."
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {cosmetics.map((c) => (
          <motion.div
            key={c.name}
            whileHover={{ y: -6, rotateX: 4, rotateY: -4, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 26 }}
            className="glass group relative overflow-hidden rounded-2xl p-4"
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