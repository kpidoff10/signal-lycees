#!/usr/bin/env python3
"""Construit public/geo/regions.json (contours simplifiés des régions, outre-mer compris).

Source : gregoiredavid/france-geojson (données IGN / INSEE, Licence Ouverte).
Usage : python3 scripts/build-regions.py
"""
import json
import math
import urllib.request

SRC = "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions-avec-outre-mer.geojson"
OUT = "public/geo/regions.json"
TOLERANCE = 0.01  # degrés (~1 km)

# Noms alignés sur l'annuaire de l'éducation (champ libelle_region).
NAMES = {"Île-de-France": "Île-de-France"}


def perp(p, a, b):
    if a == b:
        return math.dist(p, a)
    (x, y), (x1, y1), (x2, y2) = p, a, b
    return abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) / math.dist(a, b)


def rdp(points, eps):
    if len(points) < 3:
        return points
    dmax, idx = 0.0, 0
    for i in range(1, len(points) - 1):
        d = perp(points[i], points[0], points[-1])
        if d > dmax:
            dmax, idx = d, i
    if dmax > eps:
        return rdp(points[: idx + 1], eps)[:-1] + rdp(points[idx:], eps)
    return [points[0], points[-1]]


def ring(r):
    pts = rdp([tuple(p) for p in r], TOLERANCE)
    pts = [[round(x, 3), round(y, 3)] for x, y in pts]
    if pts[0] != pts[-1]:
        pts.append(pts[0])
    return pts if len(pts) >= 4 else None


def polygon(poly):
    rings = [ring(r) for r in poly]
    if not rings or rings[0] is None:
        return None
    return [rings[0]] + [r for r in rings[1:] if r]


def main():
    data = json.load(urllib.request.urlopen(SRC))
    features = []
    for f in data["features"]:
        g = f["geometry"]
        polys = [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]
        out = [p for p in (polygon(p) for p in polys) if p]
        name = NAMES.get(f["properties"]["nom"], f["properties"]["nom"])
        features.append(
            {
                "type": "Feature",
                "properties": {"code": f["properties"]["code"], "name": name},
                "geometry": {"type": "MultiPolygon", "coordinates": out},
            }
        )
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump({"type": "FeatureCollection", "features": features}, fh, ensure_ascii=False, separators=(",", ":"))
    print(OUT, len(features), "régions")


if __name__ == "__main__":
    main()
