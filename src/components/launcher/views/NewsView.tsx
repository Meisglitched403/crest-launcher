import { motion } from "framer-motion";
import { ViewHeader } from "../parts";
import news1 from "@/assets/news-1.jpg";
import news2 from "@/assets/news-2.jpg";
import news3 from "@/assets/news-3.jpg";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const articles = [
  { title: "Crest Pass Vol. 3 — The Deep Dark", tag: "Season", date: "Today", img: news3, desc: "80 tiers of exclusive cosmetics, capes and emotes drop this season.", highlight: true },
  { title: "Snapshot 25w06a — New Copper Blocks", tag: "Mojang", date: "2 days ago", img: news2, desc: "Copper doors, copper bulbs and improved lightning behavior in the latest snapshot.", highlight: false },
  { title: "Nether Speedrun Tournament", tag: "Event", date: "This weekend", img: news1, desc: "$10,000 prize pool, live commentary and duo brackets — sign up in-app.", highlight: false },
];

export function NewsView() {
  return (
    <div className="space-y-6">
      <ViewHeader title="News & Events" subtitle="Everything happening in the Crest universe." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {articles.map((a) => {
          const colSpan = a.highlight ? "md:col-span-2" : "";
          return (
            <motion.article
              key={a.title}
              layout
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className={cn("glass group overflow-hidden rounded-2xl", colSpan)}
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img src={a.img} alt={a.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-semibold backdrop-blur">
                  {a.tag}
                </div>
              </div>
              <div className="p-5">
                <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">{a.date}</div>
                <h3 className={`font-display font-semibold leading-snug ${a.highlight ? "text-xl" : "text-lg"}`}>{a.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{a.desc}</p>
                <button className="mt-3 flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  Read more <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </motion.article>
          );
        })}
      </div>

      {/* Side rail / season pass strip */}
      <div className="glass-elev-2 rounded-2xl p-6">
        <div className="font-display text-sm font-semibold mb-3">Crest Pass · Vol. 3 — The Deep Dark</div>
        <div className="flex gap-2">
          {[0, 25, 50, 75, 100].map((t) => (
            <div key={t} className={`flex-1 rounded-lg border ${t === 75 ? "border-primary bg-primary/15" : "border-white/10 bg-white/5"} p-3 text-center`}>
              <div className="text-[10px] text-muted-foreground mb-1">Tier {t}</div>
              <div className="h-6 w-6 rounded-full mx-auto gradient-primary text-[9px] font-bold text-primary-foreground grid place-items-center">
                {t % 25 === 0 ? "★" : "·"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}