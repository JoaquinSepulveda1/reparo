import type { Metadata, Viewport } from "next";
import { Spectral, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { CommandPalette } from "@/components/app/CommandPalette";

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Reparo — Revisión de contratos con IA",
    template: "%s · Reparo",
  },
  description:
    "Subí un contrato y detectamos las cláusulas riesgosas, con el marco legal chileno como referencia.",
  applicationName: "Reparo",
  openGraph: {
    title: "Reparo — Revisión de contratos con IA",
    description:
      "Detectamos cláusulas riesgosas o atípicas y les asignamos un puntaje, con el marco legal chileno como referencia.",
    siteName: "Reparo",
    locale: "es_CL",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1eee4" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1420" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es-CL"
      suppressHydrationWarning
      className={`${spectral.variable} ${inter.variable} ${plexMono.variable}`}
    >
      <body className="min-h-screen bg-paper text-ink antialiased">
        <ThemeProvider>
          {children}
          <CommandPalette />
        </ThemeProvider>
      </body>
    </html>
  );
}
