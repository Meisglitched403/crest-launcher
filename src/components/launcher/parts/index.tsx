import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ----------------------------------------------------------------------------
   Header — title / subtitle / optional action row at the top of every view
   ---------------------------------------------------------------------------- */
export function ViewHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-bold leading-tight">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function SectionRow({
  label,
  children,
  action,
}: {
  label: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      {action}
    </div>
  );
}

/* ----------------------------------------------------------------------------
   GlassCard — wraps content in an elevation-aware glass surface
   ---------------------------------------------------------------------------- */
export function GlassCard({
  children,
  className,
  elev = 2,
  hover = false,
  asMotion = false,
  href,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  elev?: 1 | 2 | 3 | 4 | 5;
  hover?: boolean;
  asMotion?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const elevClass = `glass-elev-${elev}`;
  const Comp: any = asMotion ? motion.div : "div";
  return (
    <Comp
      href={href}
      onClick={onClick}
      whileHover={hover ? { y: -4 } : undefined}
      className={cn(elevClass, "rounded-2xl", className)}
    >
      {children}
    </Comp>
  );
}

/* ----------------------------------------------------------------------------
   StatBar — small live metric bar (CPU/RAM/Net etc.)
   ---------------------------------------------------------------------------- */
export function StatBar({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: number;
}) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3 w-3" />
          {label}
        </span>
        <span className="tabular-nums text-foreground/80">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full gradient-primary"
        />
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   Chip — small pill label
   ---------------------------------------------------------------------------- */
export function Chip({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: "default" | "primary" | "success" | "warning" | "danger" | "info";
  className?: string;
}) {
  const tones: Record<string, string> = {
    default: "bg-white/10 text-muted-foreground",
    primary: "bg-primary/15 text-primary",
    success: "bg-emerald-500/20 text-emerald-300",
    warning: "bg-amber-500/20 text-amber-300",
    danger: "bg-rose-500/20 text-rose-300",
    info: "bg-sky-500/20 text-sky-300",
  };
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ----------------------------------------------------------------------------
   EmptyState — icon + message + optional CTA
   ---------------------------------------------------------------------------- */
export function EmptyState({
  icon: Icon,
  message,
  hint,
  action,
}: {
  icon: any;
  message: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
      <Icon className="h-12 w-12 opacity-30" />
      <p className="text-sm text-center">{message}</p>
      {hint && (
        <p className="text-xs text-center text-muted-foreground/70">{hint}</p>
      )}
      {action}
    </div>
  );
}

/* ----------------------------------------------------------------------------
   PrimaryButton — solid gradient button with glow + hover/tap haptics
   ---------------------------------------------------------------------------- */
export function PrimaryButton({
  children,
  onClick,
  disabled,
  className,
  type = "button",
  full,
  icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
  full?: boolean;
  icon?: ReactNode;
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.74_0.17_152_/_0.55)] transition disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
        full && "w-full",
        className,
      )}
    >
      {icon}
      {children}
    </motion.button>
  );
}

/* ----------------------------------------------------------------------------
   GhostButton — glass-bordered secondary action button
   ---------------------------------------------------------------------------- */
export function GhostButton({
  children,
  onClick,
  disabled,
  className,
  title,
  full,
  icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  title?: string;
  full?: boolean;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white/[0.03] px-3.5 py-2 text-sm font-medium text-foreground/90 transition hover:bg-white/[0.08] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
        full && "w-full",
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

/* ----------------------------------------------------------------------------
   IconButton — small square glass-backed icon action
   ---------------------------------------------------------------------------- */
export function IconButton({
  icon: Icon,
  onClick,
  title,
  className,
  destructive,
}: {
  icon: any;
  onClick?: () => void;
  title?: string;
  className?: string;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-xl border border-border bg-white/[0.03] text-muted-foreground transition hover:bg-white/[0.08] hover:text-foreground",
        destructive &&
          "hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300",
        className,
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
