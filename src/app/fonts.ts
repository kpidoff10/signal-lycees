import localFont from "next/font/local";

// Polices embarquées (SIL Open Font License), servies par Next : préchargées, avec une
// police de secours aux mêmes dimensions pour que la page ne bouge pas à leur arrivée.
export const fontSans = localFont({
  // Largeur figée à 100 ; graisses 400 à 700 variables.
  src: "../../public/fonts/InstrumentSans.woff2",
  weight: "400 700",
  variable: "--font-sans-face",
  adjustFontFallback: "Arial",
});

export const fontDisplay = localFont({
  // Graisse figée à 700 (seule utilisée) et largeur à 100 ; seule la taille optique reste variable.
  src: "../../public/fonts/BricolageGrotesque.woff2",
  weight: "700",
  variable: "--font-display-face",
  adjustFontFallback: "Arial",
});
