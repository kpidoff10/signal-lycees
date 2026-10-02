import localFont from "next/font/local";

// Polices embarquées (SIL Open Font License), servies par Next : préchargées, avec une
// police de secours aux mêmes dimensions pour que la page ne bouge pas à leur arrivée.
export const fontSans = localFont({
  src: "../../public/fonts/InstrumentSans.woff2",
  weight: "400 700",
  variable: "--font-sans-face",
  adjustFontFallback: "Arial",
});

export const fontDisplay = localFont({
  src: "../../public/fonts/BricolageGrotesque.woff2",
  weight: "200 800",
  variable: "--font-display-face",
  adjustFontFallback: "Arial",
});
