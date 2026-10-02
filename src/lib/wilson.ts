/**
 * Borne basse de l'intervalle de Wilson (95 %) : classe les problèmes d'un même
 * lycée sans qu'un problème à 2 votes passe devant un problème à 140 votes.
 * Ne sert jamais à comparer des lycées entre eux.
 */
export function wilsonLowerBound(up: number, down: number, z = 1.96): number {
  const n = up + down;
  if (n === 0) return 0;
  const p = up / n;
  const z2 = z * z;
  return (p + z2 / (2 * n) - z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n)) / (1 + z2 / n);
}
