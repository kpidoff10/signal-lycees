"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { track } from "@/lib/analytics";

export interface SchoolOption {
  type: "school";
  distanceKm?: number;
  id: string;
  slug: string;
  name: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}
export interface CityOption {
  type: "city";
  city: string;
  postalCode: string;
  count: number;
  latitude: number;
  longitude: number;
}
export type SearchOption = SchoolOption | CityOption;

/**
 * Champ de recherche avec autocomplétion (combobox ARIA) : lycées, et villes si demandé.
 */
export function SchoolSearch({
  placeholder = "Nom du lycée ou ville",
  label,
  withCities,
  onSelect,
  onClear,
  autoFocus,
  defaultValue = "",
  className,
  locate = true,
}: {
  placeholder?: string;
  label: string;
  withCities?: boolean;
  onSelect: (o: SearchOption) => void;
  onClear?: () => void;
  autoFocus?: boolean;
  defaultValue?: string;
  className?: string;
  /** Bouton « lycées autour de moi » (géolocalisation du navigateur). */
  locate?: boolean;
}) {
  const id = useId();
  const [q, setQ] = useState(defaultValue);
  const [options, setOptions] = useState<SearchOption[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [nearby, setNearby] = useState<SchoolOption[] | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const skipNext = useRef(false);

  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    const term = q.trim();
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/schools/search?q=${encodeURIComponent(term)}&cities=${withCities ? 1 : 0}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { schools: SchoolOption[]; cities: CityOption[] };
        setOptions([...data.cities, ...data.schools]);
        setOpen(true);
        setActive(-1);
        track("school_search");
      } catch {
        /* recherche annulée ou en échec : on garde la liste précédente */
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, withCities]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function choose(o: SearchOption) {
    skipNext.current = true;
    setQ(o.type === "school" ? o.name : o.city);
    setOpen(false);
    onSelect(o);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && e.key === "ArrowDown" && shown.length) setOpen(true);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, shown.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      const o = shown[active >= 0 ? active : 0];
      if (o && open) {
        e.preventDefault();
        choose(o);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function locateMe() {
    setLocateError(null);
    if (!navigator.geolocation) {
      setLocateError("Ton navigateur ne permet pas la localisation.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        // Position arrondie à ~1 km avant tout envoi.
        const lat = Math.round(pos.coords.latitude * 100) / 100;
        const lng = Math.round(pos.coords.longitude * 100) / 100;
        try {
          const res = await fetch(`/api/schools/nearby?lat=${lat}&lng=${lng}`);
          if (!res.ok) throw new Error();
          const data = (await res.json()) as { schools: SchoolOption[] };
          setNearby(data.schools);
          setQ("");
          setOpen(true);
          setActive(-1);
          if (!data.schools.length) setLocateError("Aucun lycée trouvé près de toi.");
        } catch {
          setLocateError("La recherche autour de toi a échoué. Réessaie.");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        setLocateError(
          err.code === err.PERMISSION_DENIED
            ? "Localisation refusée. Tu peux l’autoriser dans les réglages du navigateur, ou taper le nom de ton lycée."
            : "Impossible de te localiser pour le moment. Tape le nom de ton lycée.",
        );
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  const listId = `${id}-list`;
  // Moins de 2 caractères : pas de suggestions (dérivé, sans état supplémentaire).
  const shown = q.trim().length >= 2 ? options : (nearby ?? []);
  const listOpen = open && (q.trim().length >= 2 || (nearby !== null && nearby.length > 0));
  return (
    <div className={`sl-search ${className ?? ""}`} ref={boxRef}>
      <label htmlFor={`${id}-input`} className="sl-visually-hidden">
        {label}
      </label>
      <div className="sl-search-box">
        <Icon name="search" size={20} />
        <input
          id={`${id}-input`}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
          autoComplete="off"
          autoFocus={autoFocus}
          enterKeyHint="search"
          placeholder={placeholder}
          value={q}
          maxLength={100}
          onChange={(e) => {
            setQ(e.target.value);
            setNearby(null);
          }}
          onFocus={() => options.length && setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {q && (
          <button
            type="button"
            className="sl-search-clear"
            aria-label="Effacer la recherche"
            onClick={() => {
              setQ("");
              setOptions([]);
              onClear?.();
            }}
          >
            <Icon name="close" />
          </button>
        )}
        {locate && !q && (
          <button
            type="button"
            className="sl-search-locate"
            onClick={locateMe}
            disabled={locating}
            aria-label="Trouver les lycées autour de moi"
            title="Lycées autour de moi"
          >
            <Icon name="locate" />
            <span className="max-sm:sr-only">{locating ? "Localisation…" : "Autour de moi"}</span>
          </button>
        )}
      </div>
      {locateError && (
        <p role="status" className="mt-2 text-[13px] text-signal-ink">
          {locateError}
        </p>
      )}
      <ul id={listId} role="listbox" className="sl-search-list" hidden={!listOpen}>
        {nearby && !q && nearby.length > 0 && <li className="sl-search-empty !pb-1 !pt-2 text-[12px] font-bold uppercase tracking-[0.06em]">Lycées autour de toi</li>}
        {shown.length === 0 && !loading && q.trim().length >= 2 && <li className="sl-search-empty">Aucun lycée trouvé pour « {q.trim()} ».</li>}
        {loading && shown.length === 0 && <li className="sl-search-empty">Recherche…</li>}
        {shown.map((o, i) => (
          <li
            key={o.type === "school" ? o.id : `city-${o.city}`}
            id={`${id}-opt-${i}`}
            role="option"
            aria-selected={i === active}
            className="sl-search-opt"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => choose(o)}
          >
            <span className="sl-search-opt-ico">
              <Icon name={o.type === "school" ? "school" : "pin"} />
            </span>
            <span className="min-w-0">
              <span className="sl-search-opt-main block truncate">{o.type === "school" ? o.name : o.city}</span>
              <span className="sl-search-opt-sub block">
                {o.type === "school"
                  ? `${o.city} — ${o.postalCode}${o.distanceKm !== undefined ? ` · ${o.distanceKm < 1 ? "moins de 1" : Math.round(o.distanceKm)} km` : ""}`
                  : `Ville · ${o.count} ${o.count > 1 ? "lycées" : "lycée"}`}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
