// Copie le worker MapLibre (et son module partagé) dans public/ : MapLibre 6 le charge
// via une URL que Turbopack ne sert pas. Exécuté automatiquement après npm install.
import { copyFileSync, mkdirSync } from "node:fs";

const files = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];
mkdirSync("public/maplibre", { recursive: true });
for (const f of files) copyFileSync(`node_modules/maplibre-gl/dist/${f}`, `public/maplibre/${f}`);
console.log("MapLibre worker copié dans public/maplibre/");
