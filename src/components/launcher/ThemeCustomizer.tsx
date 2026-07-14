import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Palette, X, RotateCcw, Check } from "lucide-react";

/* -------------------- Presets -------------------- */

export type AccentId = "emerald" | "amber" | "sky" | "violet" | "rose" | "mono";

const ACCENTS: Record<
  AccentId,
  {
    label: string;
    swatch: string; // css for preview dot
    primary: string; // oklch
    primaryFg: string;
    ring: string;
    gradient: string;
    glow: string;
  }
> = {
  emerald: {
    label: "Emerald",
    swatch:
      "linear-gradient(135deg, oklch(0.74 0.17 152), oklch(0.78 0.17 65))",
    primary: "oklch(0.74 0.17 152)",
    primaryFg: "oklch(0.16 0.03 160)",
    ring: "oklch(0.74 0.17 152)",
    gradient:
      "linear-gradient(135deg, oklch(0.74 0.17 152), oklch(0.78 0.17 65))",
    glow: "0 0 40px oklch(0.74 0.17 152 / 0.28), 0 0 80px oklch(0.78 0.17 65 / 0.12)",
  },
  amber: {
    label: "Ember",
    swatch: "linear-gradient(135deg, oklch(0.82 0.17 75), oklch(0.7 0.2 30))",
    primary: "oklch(0.8 0.17 70)",
    primaryFg: "oklch(0.2 0.05 40)",
    ring: "oklch(0.8 0.17 70)",
    gradient:
      "linear-gradient(135deg, oklch(0.82 0.17 75), oklch(0.68 0.22 25))",
    glow: "0 0 40px oklch(0.8 0.17 70 / 0.32), 0 0 80px oklch(0.68 0.22 25 / 0.14)",
  },
  sky: {
    label: "Glacier",
    swatch:
      "linear-gradient(135deg, oklch(0.78 0.14 220), oklch(0.72 0.16 260))",
    primary: "oklch(0.76 0.14 225)",
    primaryFg: "oklch(0.16 0.03 240)",
    ring: "oklch(0.76 0.14 225)",
    gradient:
      "linear-gradient(135deg, oklch(0.78 0.14 220), oklch(0.72 0.17 265))",
    glow: "0 0 40px oklch(0.76 0.14 225 / 0.3), 0 0 80px oklch(0.72 0.17 265 / 0.14)",
  },
  violet: {
    label: "Nebula",
    swatch: "linear-gradient(135deg, oklch(0.72 0.2 300), oklch(0.72 0.2 340))",
    primary: "oklch(0.72 0.2 300)",
    primaryFg: "oklch(0.16 0.03 300)",
    ring: "oklch(0.72 0.2 300)",
    gradient:
      "linear-gradient(135deg, oklch(0.72 0.2 300), oklch(0.72 0.2 340))",
    glow: "0 0 40px oklch(0.72 0.2 300 / 0.32), 0 0 80px oklch(0.72 0.2 340 / 0.14)",
  },
  rose: {
    label: "Lava",
    swatch: "linear-gradient(135deg, oklch(0.72 0.2 15), oklch(0.78 0.17 55))",
    primary: "oklch(0.72 0.2 15)",
    primaryFg: "oklch(0.16 0.03 20)",
    ring: "oklch(0.72 0.2 15)",
    gradient:
      "linear-gradient(135deg, oklch(0.72 0.2 15), oklch(0.78 0.17 55))",
    glow: "0 0 40px oklch(0.72 0.2 15 / 0.32), 0 0 80px oklch(0.78 0.17 55 / 0.14)",
  },
  mono: {
    label: "Frost",
    swatch:
      "linear-gradient(135deg, oklch(0.92 0.01 250), oklch(0.65 0.02 250))",
    primary: "oklch(0.9 0.01 250)",
    primaryFg: "oklch(0.16 0.02 250)",
    ring: "oklch(0.85 0.02 250)",
    gradient:
      "linear-gradient(135deg, oklch(0.95 0.005 250), oklch(0.65 0.02 250))",
    glow: "0 0 40px oklch(0.85 0.02 250 / 0.22), 0 0 80px oklch(0.65 0.02 250 / 0.1)",
  },
};

const GLASS = [
  { label: "Solid", blur: "0px", opacity: "100%" },
  { label: "Subtle", blur: "10px", opacity: "92%" },
  { label: "Default", blur: "24px", opacity: "82%" },
  { label: "Heavy", blur: "44px", opacity: "68%" },
];

const FONT = [
  { label: "Compact", scale: 0.9 },
  { label: "Comfortable", scale: 1 },
  { label: "Cozy", scale: 1.08 },
  { label: "Large", scale: 1.18 },
];

const MOTION = [
  { label: "Off", reduce: true, mult: 0 },
  { label: "Subtle", reduce: false, mult: 0.6 },
  { label: "Normal", reduce: false, mult: 1 },
  { label: "Lively", reduce: false, mult: 1.35 },
];

/* -------------------- Context -------------------- */

type Theme = {
  accent: AccentId;
  glass: number; // 0..3
  font: number; // 0..3
  motion: number; // 0..3
};

const DEFAULT: Theme = { accent: "emerald", glass: 2, font: 1, motion: 2 };
const KEY = "crest.theme";

type Ctx = Theme & {
  setAccent: (a: AccentId) => void;
  setGlass: (n: number) => void;
  setFont: (n: number) => void;
  setMotion: (n: number) => void;
  reset: () => void;
  open: () => void;
};
const ThemeCtx = createContext<Ctx | null>(null);
export const useTheme = () => {
  const c = useContext(ThemeCtx);
  if (!c) throw new Error("useTheme outside provider");
  return c;
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(DEFAULT);
  const [panelOpen, setPanelOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // load once after mount (SSR-safe)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setTheme({ ...DEFAULT, ...JSON.parse(raw) });
    } catch {}
    setHydrated(true);
  }, []);

  // persist + apply CSS vars
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(theme));
    } catch {}

    const root = document.documentElement;
    const a = ACCENTS[theme.accent];
    root.style.setProperty("--primary", a.primary);
    root.style.setProperty("--primary-foreground", a.primaryFg);
    root.style.setProperty("--ring", a.ring);
    root.style.setProperty("--sidebar-primary", a.primary);
    root.style.setProperty("--sidebar-primary-foreground", a.primaryFg);
    root.style.setProperty("--sidebar-ring", a.ring);
    root.style.setProperty("--gradient-primary", a.gradient);
    root.style.setProperty("--shadow-glow", a.glow);

    const g = GLASS[theme.glass];
    root.style.setProperty("--glass-blur", g.blur);
    root.style.setProperty("--glass-opacity", g.opacity);

    const f = FONT[theme.font];
    root.style.setProperty("--ui-scale", String(f.scale));

    const m = MOTION[theme.motion];
    root.style.setProperty("--motion-mult", String(m.mult));
  }, [theme, hydrated]);

  const ctx: Ctx = {
    ...theme,
    setAccent: (accent) => setTheme((t) => ({ ...t, accent })),
    setGlass: (glass) => setTheme((t) => ({ ...t, glass })),
    setFont: (font) => setTheme((t) => ({ ...t, font })),
    setMotion: (motion) => setTheme((t) => ({ ...t, motion })),
    reset: () => setTheme(DEFAULT),
    open: () => setPanelOpen(true),
  };

  const reduced = MOTION[theme.motion].reduce;

  return (
    <ThemeCtx.Provider value={ctx}>
      <MotionConfig reducedMotion={reduced ? "always" : "never"}>
        {children}
        <CustomizerPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
      </MotionConfig>
    </ThemeCtx.Provider>
  );
}

/* -------------------- Trigger button -------------------- */

export function ThemeTrigger() {
  const { open } = useTheme();
  return (
    <button
      onClick={open}
      title="Customize theme"
      className="glass rounded-full p-2.5 transition hover:bg-white/10"
    >
      <Palette className="h-4 w-4" />
    </button>
  );
}

/* -------------------- Panel -------------------- */

function CustomizerPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTheme();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex justify-end bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.aside
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong m-3 flex h-[calc(100vh-1.5rem)] w-full max-w-sm flex-col overflow-hidden rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-white/5 p-5">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary">
                  <Palette className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-display text-base font-semibold leading-tight">
                    Personalize
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Tune Crest to your rig & taste
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              {/* Accent */}
              <Section title="Accent color" hint={ACCENTS[t.accent].label}>
                <div className="grid grid-cols-6 gap-2">
                  {(Object.keys(ACCENTS) as AccentId[]).map((id) => {
                    const a = ACCENTS[id];
                    const active = t.accent === id;
                    return (
                      <button
                        key={id}
                        onClick={() => t.setAccent(id)}
                        title={a.label}
                        className={`group relative aspect-square rounded-xl transition ${
                          active
                            ? "ring-2 ring-white/80 ring-offset-2 ring-offset-transparent"
                            : "hover:scale-105"
                        }`}
                        style={{ background: a.swatch }}
                      >
                        {active && (
                          <Check
                            className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow"
                            strokeWidth={3}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </Section>

              {/* Glass */}
              <Section title="Glass intensity" hint={GLASS[t.glass].label}>
                <Segmented
                  value={t.glass}
                  onChange={t.setGlass}
                  options={GLASS.map((g) => g.label)}
                />
                <Preview>
                  <div
                    className="rounded-xl border border-white/10 p-3"
                    style={{
                      background: `color-mix(in oklab, var(--card) ${GLASS[t.glass].opacity}, transparent)`,
                      backdropFilter: `blur(${GLASS[t.glass].blur}) saturate(160%)`,
                    }}
                  >
                    <div className="text-xs text-muted-foreground">
                      Frosted surface preview
                    </div>
                    <div className="mt-1 font-display text-sm">
                      The quick brown fox jumps.
                    </div>
                  </div>
                </Preview>
              </Section>

              {/* Font size */}
              <Section title="Font size" hint={FONT[t.font].label}>
                <Segmented
                  value={t.font}
                  onChange={t.setFont}
                  options={FONT.map((f) => f.label)}
                />
                <Preview>
                  <div style={{ fontSize: `${16 * FONT[t.font].scale}px` }}>
                    <div className="font-display font-semibold">
                      Aa — Play smarter.
                    </div>
                    <div
                      className="text-muted-foreground"
                      style={{ fontSize: `${13 * FONT[t.font].scale}px` }}
                    >
                      Interface text scales instantly across every view.
                    </div>
                  </div>
                </Preview>
              </Section>

              {/* Motion */}
              <Section title="Motion" hint={MOTION[t.motion].label}>
                <Segmented
                  value={t.motion}
                  onChange={t.setMotion}
                  options={MOTION.map((m) => m.label)}
                />
                <Preview>
                  <MotionPreview level={t.motion} />
                </Preview>
              </Section>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-white/5 p-4">
              <button
                onClick={t.reset}
                className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-muted-foreground hover:bg-white/5 hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
              <button
                onClick={onClose}
                className="rounded-full gradient-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                Looks good
              </button>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h3>
        {hint && (
          <span className="font-mono text-[11px] text-foreground/70">
            {hint}
          </span>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: number;
  onChange: (n: number) => void;
  options: string[];
}) {
  return (
    <div className="relative flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
      {options.map((label, i) => {
        const active = i === value;
        return (
          <button
            key={label}
            onClick={() => onChange(i)}
            className={`relative flex-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition ${
              active
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {active && (
              <motion.span
                layoutId="seg-active"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-lg gradient-primary"
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Preview({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 p-3">
      {children}
    </div>
  );
}

function MotionPreview({ level }: { level: number }) {
  const mult = MOTION[level].mult;
  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`${level}-${i}`}
          initial={{ y: 0, opacity: 0.4 }}
          animate={{ y: mult === 0 ? 0 : -6 * mult, opacity: 1 }}
          transition={{
            duration: mult === 0 ? 0 : 0.6 / Math.max(0.4, mult),
            repeat: mult === 0 ? 0 : Infinity,
            repeatType: "reverse",
            delay: i * 0.12,
          }}
          className="h-8 w-8 rounded-lg gradient-primary"
        />
      ))}
      <div className="ml-auto font-mono text-[11px] text-muted-foreground">
        ×{mult.toFixed(2)}
      </div>
    </div>
  );
}
