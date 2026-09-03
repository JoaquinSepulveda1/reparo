"use client";

import { motion } from "framer-motion";

/**
 * `template.tsx` se re-monta en cada navegación → transición corta de entrada.
 * Solo animamos opacidad: un `transform` en este contenedor rompería
 * `position: sticky` del header y `position: fixed` de los modales.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
