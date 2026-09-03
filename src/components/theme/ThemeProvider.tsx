"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Provider de tema. `data-theme="light" | "dark"` en <html>, con preferencia del
 * sistema como base. `next-themes` inyecta un script que evita el flash de tema.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
