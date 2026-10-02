// Génère les icônes PNG à partir du logo (point orange et son halo).
// Usage : node scripts/build-icons.mjs
import sharp from "sharp";

const svg = (size, { background, scale }) => {
  const r = (size / 2) * scale;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : ""}
  <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="#fbe4d6"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${r * 0.74}" fill="#c2410c"/>
</svg>`);
};

const out = [
  // iOS : fond opaque obligatoire, marge pour les coins arrondis.
  ["src/app/apple-icon.png", 180, { background: "#f5f3ec", scale: 0.78 }],
  // Android / PWA : icônes « maskable » avec zone de sécurité.
  ["public/icons/icon-192.png", 192, { background: "#f5f3ec", scale: 0.72 }],
  ["public/icons/icon-512.png", 512, { background: "#f5f3ec", scale: 0.72 }],
  // Favicon transparent pour les anciens navigateurs.
  ["public/icons/favicon-48.png", 48, { background: null, scale: 0.97 }],
];
for (const [file, size, opts] of out) {
  await sharp(svg(size, opts)).png().toFile(file);
  console.log(file);
}
