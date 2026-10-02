// Outils géographiques côté client pour la carte nationale.
export type LngLat = [number, number];
export type BBox = [number, number, number, number]; // ouest, sud, est, nord

export interface RegionFeature {
  type: "Feature";
  id?: string | number;
  properties: { code: string; name: string };
  geometry: { type: "MultiPolygon"; coordinates: number[][][][] };
}
export interface RegionCollection {
  type: "FeatureCollection";
  features: RegionFeature[];
}

export const METRO_BOUNDS: BBox = [-5.3, 41.3, 9.7, 51.15];
export const OVERSEAS = ["Guadeloupe", "Martinique", "Guyane", "La Réunion", "Mayotte"];
/** En dessous de ce zoom : une bulle par région ; au-dessus : lycées et groupes. */
export const REGION_ZOOM = 6.3;
/**
 * Bulles régionales seulement quand il y a beaucoup de lycées signalés : en dessous,
 * les points sont lisibles dès la vue France et on les montre directement.
 */
export const REGION_MODE_MIN_SCHOOLS = 400;

function ringArea(r: number[][]) {
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j]![0]! + r[i]![0]!) * (r[j]![1]! - r[i]![1]!);
  return Math.abs(a / 2);
}

export function regionBBox(f: RegionFeature): BBox {
  const b: BBox = [180, 90, -180, -90];
  for (const poly of f.geometry.coordinates)
    for (const [x, y] of poly[0]!) {
      b[0] = Math.min(b[0], x!);
      b[1] = Math.min(b[1], y!);
      b[2] = Math.max(b[2], x!);
      b[3] = Math.max(b[3], y!);
    }
  return b;
}

/** Point d'étiquette : centre de gravité du plus grand polygone. */
export function regionLabelPoint(f: RegionFeature): LngLat {
  const largest = [...f.geometry.coordinates].sort((a, b) => ringArea(b[0]!) - ringArea(a[0]!))[0]![0]!;
  let x = 0;
  let y = 0;
  let area = 0;
  for (let i = 0, j = largest.length - 1; i < largest.length; j = i++) {
    const [x0, y0] = largest[j]! as [number, number];
    const [x1, y1] = largest[i]! as [number, number];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    x += (x0 + x1) * cross;
    y += (y0 + y1) * cross;
  }
  area /= 2;
  return [x / (6 * area), y / (6 * area)];
}

/** Distance approximative en km (équirectangulaire, suffisant pour trier). */
export function distanceKm(a: LngLat, b: LngLat): number {
  const rad = Math.PI / 180;
  const x = (b[0] - a[0]) * Math.cos(((a[1] + b[1]) / 2) * rad);
  const y = b[1] - a[1];
  return Math.sqrt(x * x + y * y) * 111.32;
}

export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
