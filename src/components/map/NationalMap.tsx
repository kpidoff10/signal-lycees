"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { Map as MLMap, Marker, setWorkerUrl, type GeoJSONSource, type MapLayerMouseEvent } from "maplibre-gl";
import Supercluster from "supercluster";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CategoryChips, Chip } from "@/components/ui/Chips";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import { SchoolSearch, type SearchOption } from "@/components/school/SchoolSearch";
import { track } from "@/lib/analytics";
import { formatNumber, plural } from "@/lib/format";
import { DEFAULT_FILTERS, filtersToQuery, markerLevel, PERIODS, type MapFilters, type Period } from "@/lib/map-filters";
import {
  cssVar,
  distanceKm,
  METRO_BOUNDS,
  OVERSEAS,
  REGION_MODE_MIN_SCHOOLS,
  REGION_ZOOM,
  regionBBox,
  regionLabelPoint,
  type BBox,
  type LngLat,
  type RegionCollection,
  type RegionFeature,
} from "./geo";
import { SchoolCard, SchoolSheet, type SchoolDetail } from "./SchoolCard";

interface MapSchool {
  id: string;
  slug: string;
  name: string;
  city: string;
  region: string;
  lat: number;
  lng: number;
  count: number;
  active: number;
  confirmations: number;
  dominant: string | null;
  mob: string | null;
}

type PointProps = { id: string; name: string; city: string; count: number; mob: number };

const COMPACT_WIDTH = 640;

// Worker servi depuis public/ (copié par scripts/copy-maplibre.mjs).
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
  const e = document.createElement(tag);
  e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

function heatColors(): (string | number)[] {
  return [0, "rgba(0,0,0,0)", 0.15, cssVar("--heat-1"), 0.4, cssVar("--heat-2"), 0.7, cssVar("--heat-3"), 1, cssVar("--heat-4")];
}

export default function NationalMap() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const regionsRef = useRef<RegionFeature[]>([]);
  const indexRef = useRef<Supercluster<PointProps, { mob: number }> | null>(null);
  const selectRef = useRef<(id: string, at?: LngLat) => void>(() => {});
  const selectedRef = useRef<string | null>(null);

  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [mode, setMode] = useState<"markers" | "heat">("markers");
  const [compact, setCompact] = useState(false);
  const [ready, setReady] = useState(false);
  const [zoomedIn, setZoomedIn] = useState(false);
  const [regionName, setRegionName] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [view, setView] = useState<{ center: LngLat; bounds: BBox } | null>(null);
  const [nearbyLimit, setNearbyLimit] = useState(5);
  const [locating, setLocating] = useState(false);

  const query = filtersToQuery(filters);
  const { data, isFetching, isError } = useQuery({
    queryKey: ["map", query],
    queryFn: async () => {
      const res = await fetch(`/api/map?${query}`);
      if (!res.ok) throw new Error("map");
      return (await res.json()) as { schools: MapSchool[] };
    },
    placeholderData: (prev) => prev,
  });
  const schools = useMemo(() => data?.schools ?? [], [data]);

  const detail = useQuery({
    queryKey: ["map-school", selected],
    enabled: !!selected,
    queryFn: async () => {
      const res = await fetch(`/api/map/school/${selected}`);
      if (!res.ok) throw new Error("school");
      return (await res.json()) as SchoolDetail;
    },
  });

  const regionTotals = useMemo(() => {
    const t = new Map<string, number>();
    for (const s of schools) t.set(s.region, (t.get(s.region) ?? 0) + s.count);
    return t;
  }, [schools]);
  const useRegions = schools.length >= REGION_MODE_MIN_SCHOOLS;
  const regionMobs = useMemo(() => new Set(schools.filter((s) => s.mob).map((s) => s.region)), [schools]);

  // Largeur du composant → disposition compacte (mobile) sous 640 px.
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const ro = new ResizeObserver(([entry]) => setCompact((entry?.contentRect.width ?? 1000) < COMPACT_WIDTH));
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  // Création de la carte (une fois).
  useEffect(() => {
    if (!stageRef.current || mapRef.current) return;
    const map = new MLMap({
      container: stageRef.current,
      style: {
        version: 8,
        sources: {
          regions: { type: "geojson", data: "/geo/regions.json", promoteId: "code" },
          schools: { type: "geojson", data: { type: "FeatureCollection", features: [] } },
        },
        layers: [
          { id: "bg", type: "background", paint: { "background-color": cssVar("--paper") } },
          {
            id: "land",
            type: "fill",
            source: "regions",
            paint: {
              "fill-color": ["case", ["boolean", ["feature-state", "hover"], false], cssVar("--land-hover"), cssVar("--land")],
            },
          },
          { id: "land-line", type: "line", source: "regions", paint: { "line-color": cssVar("--region-line"), "line-width": 1.25 } },
          {
            id: "heat",
            type: "heatmap",
            source: "schools",
            layout: { visibility: "none" },
            paint: {
              "heatmap-weight": ["interpolate", ["linear"], ["get", "count"], 0, 0, 25, 1],
              "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 4, 0.8, 10, 2],
              "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 4, 16, 10, 36],
              "heatmap-opacity": 0.9,
              "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], ...heatColors()] as never,
            },
          },
        ],
      },
      bounds: METRO_BOUNDS,
      fitBoundsOptions: { padding: { top: 24, bottom: 56, left: 16, right: 16 } },
      minZoom: 3.5,
      maxZoom: 15,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      renderWorldCopies: false,
      // Ordinateur : Ctrl + molette pour zoomer. Mobile : deux doigts pour déplacer,
      // un doigt laisse défiler la page.
      cooperativeGestures: true,
      // Sources citées sous la carte (contours IGN, Annuaire de l’éducation).
      attributionControl: false,
      locale: {
        "CooperativeGesturesHandler.WindowsHelpText": "Ctrl + molette pour zoomer sur la carte",
        "CooperativeGesturesHandler.MacHelpText": "⌘ + molette pour zoomer sur la carte",
        "CooperativeGesturesHandler.MobileHelpText": "Utilise deux doigts pour déplacer la carte",
      },
    });
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();
    mapRef.current = map;

    let hovered: string | number | undefined;
    map.on("mousemove", "land", (e: MapLayerMouseEvent) => {
      const id = e.features?.[0]?.id;
      if (hovered !== undefined && hovered !== id) map.setFeatureState({ source: "regions", id: hovered }, { hover: false });
      hovered = id;
      if (id !== undefined) map.setFeatureState({ source: "regions", id }, { hover: true });
      map.getCanvas().style.cursor = map.getZoom() < REGION_ZOOM ? "pointer" : "";
    });
    map.on("mouseleave", "land", () => {
      if (hovered !== undefined) map.setFeatureState({ source: "regions", id: hovered }, { hover: false });
      hovered = undefined;
      map.getCanvas().style.cursor = "";
    });
    map.on("click", "land", (e: MapLayerMouseEvent) => {
      if (map.getZoom() >= REGION_ZOOM) return;
      const code = e.features?.[0]?.properties?.code;
      const f = regionsRef.current.find((r) => r.properties.code === code);
      if (f) map.fitBounds(regionBBox(f), { padding: 40, duration: 500 });
    });

    const onView = () => {
      const c = map.getCenter();
      const b = map.getBounds();
      setView({ center: [c.lng, c.lat], bounds: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()] });
      setZoomedIn(map.getZoom() >= REGION_ZOOM);
      const point = map.project(c);
      const f = map.queryRenderedFeatures(point, { layers: ["land"] })[0];
      setRegionName((f?.properties?.name as string | undefined) ?? null);
    };
    map.on("moveend", onView);

    map.on("load", async () => {
      const res = await fetch("/geo/regions.json");
      const geo = (await res.json()) as RegionCollection;
      regionsRef.current = geo.features;
      setReady(true);
      onView();
      // Lien « Voir sur la carte » depuis une fiche lycée : ?focus=<id>&lat=&lng=
      const params = new URLSearchParams(window.location.search);
      const focus = params.get("focus");
      const lat = Number(params.get("lat"));
      const lng = Number(params.get("lng"));
      if (focus && /^[a-z0-9]{10,40}$/.test(focus) && Number.isFinite(lat) && Number.isFinite(lng)) {
        selectRef.current(focus, [lng, lat]);
      }
    });

    // Thème clair / sombre : on relit les tokens.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onTheme = () => {
      if (!map.isStyleLoaded()) return;
      map.setPaintProperty("bg", "background-color", cssVar("--paper"));
      map.setPaintProperty("land", "fill-color", ["case", ["boolean", ["feature-state", "hover"], false], cssVar("--land-hover"), cssVar("--land")]);
      map.setPaintProperty("land-line", "line-color", cssVar("--region-line"));
      map.setPaintProperty("heat", "heatmap-color", ["interpolate", ["linear"], ["heatmap-density"], ...heatColors()] as never);
    };
    mq.addEventListener("change", onTheme);

    return () => {
      mq.removeEventListener("change", onTheme);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Données → source GeoJSON (heatmap) + index de regroupement.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const features = schools.map((s) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [s.lng, s.lat] },
      properties: { id: s.id, name: s.name, city: s.city, count: s.count, mob: s.mob ? 1 : 0 },
    }));
    (map.getSource("schools") as GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features });
    const index = new Supercluster<PointProps, { mob: number }>({
      // Regroupement léger : seuls les points qui se chevauchent vraiment sont groupés.
      radius: 20,
      maxZoom: 9,
      minPoints: 2,
      map: (p) => ({ mob: p.mob }),
      reduce: (acc, p) => {
        acc.mob += p.mob;
      },
    });
    index.load(features);
    indexRef.current = index;
  }, [schools, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setLayoutProperty("heat", "visibility", mode === "heat" ? "visible" : "none");
    map.setPaintProperty("land", "fill-color", [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      cssVar("--land-hover"),
      cssVar(mode === "heat" ? "--land-dim" : "--land"),
    ]);
  }, [mode, ready]);

  useEffect(() => {
    selectRef.current = (id: string, at?: LngLat) => {
      setSelected(id);
      setSheetExpanded(false);
      track("map_marker_click", { school: id });
      const map = mapRef.current;
      if (map && at) {
        const offset: [number, number] = compact ? [0, -90] : [-170, 0];
        map.easeTo({ center: at, zoom: Math.max(map.getZoom(), 11), offset, duration: 500 });
      }
    };
  }, [compact]);

  // Rendu des marqueurs HTML (bulles régionales, groupes, lycées).
  const renderMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    for (const m of markersRef.current) m.remove();
    markersRef.current = [];
    if (mode === "heat") return;
    const zoom = map.getZoom();

    if (useRegions && zoom < REGION_ZOOM) {
      for (const f of regionsRef.current) {
        const total = regionTotals.get(f.properties.name) ?? 0;
        const mobilized = regionMobs.has(f.properties.name);
        if (!total && !mobilized) continue;
        const b = el("button", "sl-region");
        b.type = "button";
        b.setAttribute(
          "aria-label",
          `${f.properties.name} : ${total} ${plural(total, "signalement")}${mobilized ? ", mobilisations en cours" : ""}. Zoomer sur la région`,
        );
        const lvl = total > 150 ? " lvl-3" : total > 60 ? " lvl-2" : "";
        const count = el("span", `sl-region-count${lvl}`, total ? formatNumber(total) : "📣");
        if (mobilized && total) count.append(el("span", "sl-mob-badge", "📣"));
        b.append(count);
        if (!compact) b.append(el("span", "sl-region-name", f.properties.name));
        b.addEventListener("click", (e) => {
          e.stopPropagation();
          map.fitBounds(regionBBox(f), { padding: 40, duration: 500 });
        });
        markersRef.current.push(new Marker({ element: b, anchor: "top" }).setLngLat(regionLabelPoint(f)).addTo(map));
      }
      return;
    }

    const index = indexRef.current;
    if (!index) return;
    const bounds = map.getBounds();
    const clusters = index.getClusters([bounds.getWest() - 0.5, bounds.getSouth() - 0.5, bounds.getEast() + 0.5, bounds.getNorth() + 0.5], Math.floor(zoom));
    for (const c of clusters) {
      const [lng, lat] = c.geometry.coordinates as LngLat;
      const props = c.properties as PointProps & { cluster?: boolean; cluster_id?: number; point_count?: number };
      const mobBadge = () => el("span", "sl-mob-badge", "📣");
      if (props.cluster && props.cluster_id !== undefined) {
        const n = props.point_count ?? 0;
        const size = Math.min(56, 36 + Math.log2(n) * 4);
        const b = el("button", "sl-cluster");
        b.type = "button";
        b.setAttribute("aria-label", `${n} lycées regroupés. Zoomer`);
        const disc = el("span", "sl-cluster-disc", formatNumber(n));
        disc.style.width = disc.style.height = `${size}px`;
        if (props.mob > 0) disc.append(mobBadge());
        b.append(disc);
        if (zoom >= 8) {
          const cities = new Map<string, number>();
          for (const leaf of index.getLeaves(props.cluster_id, 40)) {
            const city = (leaf.properties as PointProps).city;
            cities.set(city, (cities.get(city) ?? 0) + 1);
          }
          const city = [...cities.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
          if (city) b.append(el("span", "sl-cluster-label", city));
        }
        const clusterId = props.cluster_id;
        b.addEventListener("click", (e) => {
          e.stopPropagation();
          const z = Math.min(index.getClusterExpansionZoom(clusterId), 15);
          map.easeTo({ center: [lng, lat], zoom: z, duration: 500 });
        });
        markersRef.current.push(new Marker({ element: b }).setLngLat([lng, lat]).addTo(map));
      } else {
        const onlyMob = props.count === 0 && props.mob > 0;
        const lvl = markerLevel(props.count);
        const b = el("button", onlyMob ? "sl-marker sl-marker-mob" : `sl-marker sl-marker-${lvl}`);
        b.type = "button";
        b.setAttribute(
          "aria-label",
          `${props.name}, ${props.city} : ${props.count} ${plural(props.count, "signalement")}${props.mob ? ", mobilisation en cours" : ""}`,
        );
        b.dataset.school = props.id;
        b.setAttribute("aria-expanded", String(props.id === selectedRef.current));
        if (onlyMob) b.append(el("span", "sl-marker-dot", "📣"));
        else {
          const dot = el("span", "sl-marker-dot");
          if (props.mob) dot.append(mobBadge());
          b.append(dot);
        }
        b.addEventListener("click", (e) => {
          e.stopPropagation();
          selectRef.current(props.id, [lng, lat]);
        });
        markersRef.current.push(new Marker({ element: b }).setLngLat([lng, lat]).addTo(map));
      }
    }
  }, [ready, mode, regionTotals, regionMobs, compact, useRegions]);

  // Sélection : on met à jour l'attribut sans recréer les marqueurs.
  useEffect(() => {
    selectedRef.current = selected;
    for (const m of markersRef.current) {
      const e = m.getElement();
      if (e.dataset.school) e.setAttribute("aria-expanded", String(e.dataset.school === selected));
    }
  }, [selected]);

  useEffect(() => {
    renderMarkers();
    const map = mapRef.current;
    if (!map) return;
    map.on("moveend", renderMarkers);
    return () => {
      map.off("moveend", renderMarkers);
    };
  }, [renderMarkers, schools]);

  // Échap ferme la card.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function zoomBy(delta: number) {
    const map = mapRef.current;
    if (map) map.easeTo({ zoom: map.getZoom() + delta, duration: 300 });
  }

  function resetFrance() {
    setSelected(null);
    mapRef.current?.fitBounds(METRO_BOUNDS, { padding: { top: 24, bottom: 56, left: 16, right: 16 }, duration: 500 });
  }

  function onSearch(o: SearchOption) {
    const map = mapRef.current;
    if (!map) return;
    if (o.type === "city") {
      setSelected(null);
      map.flyTo({ center: [o.longitude, o.latitude], zoom: 11.5, duration: 700 });
    } else {
      selectRef.current(o.id, [o.longitude, o.latitude]);
    }
  }

  function goOverseas(name: string) {
    const f = regionsRef.current.find((r) => r.properties.name === name);
    if (f) mapRef.current?.fitBounds(regionBBox(f), { padding: 30, duration: 600 });
  }

  function locateMe() {
    if (!navigator.geolocation) return;
    setLocating(true);
    // La position reste dans le navigateur : elle n'est jamais envoyée au serveur.
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        mapRef.current?.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 11.5, duration: 700 });
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
  }

  const nearby = useMemo(() => {
    if (!view || !zoomedIn) return [];
    const [w, s, e, n] = view.bounds;
    return schools
      .filter((x) => x.lng >= w && x.lng <= e && x.lat >= s && x.lat <= n)
      .map((x) => ({ ...x, d: distanceKm(view.center, [x.lng, x.lat]) }))
      .sort((a, b) => a.d - b.d);
  }, [schools, view, zoomedIn]);

  const empty = ready && !isFetching && schools.length === 0;
  const legendNote = zoomedIn
    ? null
    : compact
      ? "Touche une région pour zoomer"
      : "Clique sur une région pour zoomer jusqu’aux villes, puis aux lycées.";

  return (
    <div ref={rootRef} className={`sl-nm${compact ? " is-compact" : ""}${mode === "heat" ? " is-heat" : ""}`}>
      <div className="sl-nm-toolbar">
        <div className="sl-nm-row">
          <SchoolSearch label="Rechercher une ville ou un lycée sur la carte" placeholder="Rechercher une ville ou un lycée" withCities onSelect={onSearch} />
          {!compact && <span className="sl-nm-spacer" />}
          {!compact && (
            <Segmented
              label="Affichage de la carte"
              value={mode}
              onChange={setMode}
              options={[
                { value: "markers", label: "Établissements" },
                { value: "heat", label: "Carte de densité" },
              ]}
            />
          )}
        </div>
        <CategoryChips value={filters.cats} onChange={(cats) => setFilters((f) => ({ ...f, cats }))} scroll={compact} />
        <div className="sl-nm-row">
          <Chip
            label="Mobilisations en cours"
            emoji="📣"
            selected={!!filters.mobOnly}
            onClick={() => setFilters((f) => ({ ...f, mobOnly: !f.mobOnly }))}
          />
          <Switch
            label={compact ? "Actifs uniquement" : "Problèmes actifs uniquement"}
            checked={filters.activeOnly}
            onChange={(activeOnly) => setFilters((f) => ({ ...f, activeOnly }))}
          />
          <Segmented<Period>
            label="Période"
            value={filters.period}
            onChange={(period) => setFilters((f) => ({ ...f, period }))}
            options={PERIODS.map((p) => ({ value: p.value, label: p.label }))}
          />
          {compact && (
            <Segmented
              label="Affichage de la carte"
              value={mode}
              onChange={setMode}
              options={[
                { value: "markers", label: "Établissements" },
                { value: "heat", label: "Carte de densité" },
              ]}
            />
          )}
        </div>
      </div>

      <div className="sl-nm-stage sl-map" style={compact ? undefined : undefined}>
        <div ref={stageRef} style={{ position: "absolute", inset: 0 }} aria-label="Carte des lycées ayant des signalements" role="region" />

        {zoomedIn && (
          <div className="sl-nm-crumb">
            <Button variant="secondary" size="sm" icon="back" onClick={resetFrance}>
              France entière
            </Button>
            {regionName && <span className="sl-nm-crumb-label">{regionName}</span>}
          </div>
        )}

        <div className="sl-nm-zoom">
          <button type="button" aria-label="Zoomer" onClick={() => zoomBy(1)}>
            <Icon name="plus" />
          </button>
          <button type="button" aria-label="Dézoomer" onClick={() => zoomBy(-1)}>
            <Icon name="minus" />
          </button>
        </div>

        <div className="sl-nm-legend">
          <MapLegend mode={mode} zoomedIn={zoomedIn || !useRegions} note={legendNote} />
        </div>

        {(empty || isError) && (
          <div className="sl-nm-empty" role="status">
            {isError
              ? "La carte n’a pas pu se charger. Réessaie dans un instant."
              : filters.mobOnly
                ? "Aucune mobilisation signalée en ce moment."
                : filters.cats.length || filters.period !== "all"
                ? "Aucun signalement ne correspond à ces filtres."
                : "Aucun signalement pour l’instant. Sois le premier à faire entendre ton lycée."}
          </div>
        )}

        {selected && detail.data && !compact && (
          <div className="sl-nm-floating right-4 top-1/2 -translate-y-1/2 max-[900px]:right-auto max-[900px]:left-1/2 max-[900px]:-translate-x-1/2">
            <SchoolCard d={detail.data} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>
      {/* Mobile : panneau fixé en bas de l'écran, quel que soit l'endroit de la page. */}
      {selected && detail.data && compact && (
        <SchoolSheet d={detail.data} expanded={sheetExpanded} onExpand={setSheetExpanded} onClose={() => setSelected(null)} />
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-ink-muted">
        <span className="font-semibold text-ink">Outre-mer :</span>
        {OVERSEAS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => goOverseas(name)}
            className="rounded-full border border-border bg-surface px-3 py-1.5 font-semibold text-ink hover:border-border-strong"
          >
            {name}
            {regionTotals.get(name) ? <span className="num ml-1.5 text-ink-muted">{formatNumber(regionTotals.get(name)!)}</span> : null}
          </button>
        ))}
      </div>

      <p className="sl-nm-hint">
        {compact ? "Deux doigts pour déplacer ou zoomer sur la carte" : "Ctrl + molette ou pincer pour zoomer"} · Les chiffres montrent des signalements, pas une note des
        établissements. Sources : Annuaire de l’éducation, contours © IGN.
      </p>

      {compact && (
        <section className="mt-6" aria-labelledby="nearby-title">
          <div className="sl-nearby-h">
            <h3 id="nearby-title" className="sl-nearby-title">
              Autour de cette zone
            </h3>
            <span className="sl-nearby-count">{zoomedIn ? `${nearby.length} ${plural(nearby.length, "lycée visible", "lycées visibles")}` : "France entière"}</span>
          </div>
          {nearby.length === 0 ? (
            <p className="sl-nearby-empty">
              {zoomedIn ? "Aucun lycée signalé dans cette zone." : "Zoome sur ta région ou cherche ta ville pour voir les lycées autour de toi."}
            </p>
          ) : (
            <ul className="sl-nearby">
              {nearby.slice(0, nearbyLimit).map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className="sl-item"
                    onClick={() => selectRef.current(s.id, [s.lng, s.lat])}
                  >
                    <span className={`sl-marker-${markerLevel(s.count)} grid w-8 place-items-center`}>
                      <span className="sl-marker-dot" />
                    </span>
                    <span className="sl-item-main">
                      <span className="sl-item-name">{s.name}</span>
                      <span className="sl-item-meta">
                        {s.mob && "📣 "}
                        {s.city} · <b>{s.active}</b> {plural(s.active, "actif")} · <b>{formatNumber(s.confirmations)}</b> conf.
                      </span>
                    </span>
                    <Icon name="chevron" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {nearby.length > nearbyLimit && (
            <Button variant="secondary" block className="sl-nearby-more" onClick={() => setNearbyLimit((l) => l + 10)}>
              Afficher plus
            </Button>
          )}
          <Button variant="secondary" block icon="locate" className="mt-3" onClick={locateMe} disabled={locating}>
            {locating ? "Localisation…" : "Autour de moi"}
          </Button>
        </section>
      )}
    </div>
  );
}

function MapLegend({ mode, zoomedIn, note }: { mode: "markers" | "heat"; zoomedIn: boolean; note: string | null }) {
  if (mode === "heat") {
    return (
      <div className="sl-legend">
        <span className="sl-legend-title">Volume de signalements</span>
        <span className="sl-legend-ramp" />
        <span className="sl-legend-ends">
          <span>faible</span>
          <span>élevé</span>
        </span>
      </div>
    );
  }
  if (!zoomedIn) {
    return (
      <div className="sl-legend">
        <span className="sl-legend-title">Signalements par région</span>
        {note && <span className="sl-legend-note">{note}</span>}
      </div>
    );
  }
  const sw = (size: number, color: string) => (
    <span className="sl-legend-sw" style={{ width: size, height: size, background: `var(${color})` }} />
  );
  return (
    <div className="sl-legend">
      <span className="sl-legend-title">Signalements par lycée</span>
      <span className="sl-legend-row">
        <span className="sl-legend-item">
          {sw(12, "--marker-1")}1–5
        </span>
        <span className="sl-legend-item">
          {sw(18, "--marker-2")}6–20
        </span>
        <span className="sl-legend-item">
          {sw(24, "--marker-3")}20+
        </span>
        <span className="sl-legend-item">
          {sw(14, "--cluster")}groupe
        </span>
        <span className="sl-legend-item">📣 mobilisation</span>
      </span>
    </div>
  );
}
