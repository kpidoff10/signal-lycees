import type { Metadata, Viewport } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import { Providers } from "@/components/layout/Providers";
import { publicEnv } from "@/lib/env";
import { fontDisplay, fontSans } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: { default: "Signal Lycées — Ce qui se passe dans ton lycée mérite d’être entendu", template: "%s | Signal Lycées" },
  description:
    "Signale un problème dans ton lycée, découvre si d’autres élèves le rencontrent et fais remonter les situations qui comptent. Gratuit, anonyme, sans classement.",
  applicationName: "Signal Lycées",
  // Search Console (propriété « préfixe d’URL »), validée par balise : ne dépend pas du DNS.
  verification: { google: "fDwTU-f_J_hVIdaNDNkkP4aCduXl3vCVVvTrMqkftZ4" },
  openGraph: { type: "website", locale: "fr_FR", siteName: "Signal Lycées" },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f3ec" },
    { media: "(prefers-color-scheme: dark)", color: "#121413" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${fontSans.variable} ${fontDisplay.variable}`}>
      <body className="sl flex min-h-dvh flex-col">
        <a href="#contenu" className="fixed left-4 top-4 z-[100] -translate-y-32 rounded-md bg-surface p-3 font-semibold shadow focus:translate-y-0">
          Aller au contenu
        </a>
        <Providers>{children}</Providers>
        {publicEnv.plausibleDomain && (
          <Script defer data-domain={publicEnv.plausibleDomain} src="https://plausible.io/js/script.js" strategy="afterInteractive" />
        )}
      </body>
    </html>
  );
}
