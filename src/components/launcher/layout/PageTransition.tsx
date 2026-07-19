import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { useTheme } from "@/components/launcher/ThemeCustomizer";

export function PageTransition({
  active,
  children,
}: {
  active: string;
  children: ReactNode;
}) {
  const themeCtx = useTheme();
  const mult = themeCtx.motion === 0 ? 0 : [0.6, 1, 1.35][themeCtx.motion] ?? 1;
  const duration = mult === 0 ? 0 : 0.25 / Math.max(0.4, mult);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={active}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={
          mult === 0
            ? { duration: 0 }
            : { duration, ease: [0.22, 1, 0.36, 1] }
        }
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
