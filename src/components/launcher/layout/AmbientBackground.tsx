/* ----------------------------------------------------------------------------
   AmbientBackground — fixed full-screen ambient orb layer + grain overlay
   Uses theme CSS vars (--orb-1, --orb-2, --grain-opacity) so it adapts to
   light/dark + custom accents automatically.
   ---------------------------------------------------------------------------- */
export function AmbientBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      {/* Soft radial gradient washes — anchored to top and bottom-right */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,theme(colors.violet.500/0.18),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,theme(colors.cyan.400/0.14),transparent_55%)]" />

      {/* Floating ambient orbs */}
      <div
        className="absolute -left-40 top-1/4 h-96 w-96 rounded-full blur-3xl animate-float-orb"
        style={{ background: "var(--orb-1)" }}
      />
      <div
        className="absolute -right-40 bottom-0 h-[28rem] w-[28rem] rounded-full blur-3xl animate-float-orb-alt"
        style={{ background: "var(--orb-2)", animationDelay: "3s" }}
      />

      {/* Subtle film grain — kept very low-opacity for a tactile feel */}
      <div className="grain absolute inset-0" />
    </div>
  );
}
