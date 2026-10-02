"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { track } from "@/lib/analytics";

export interface SchoolOption {
  type: "school";
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
}: {
  placeholder?: string;
  label: string;
  withCities?: boolean;
  onSelect: (o: SearchOption) => void;
  onClear?: () => void;
  autoFocus?: boolean;
  defaultValue?: string;
  className?: string;
}) {
  const id = useId();
  const [q, setQ] = useState(defaultValue);
  const [options, setOptions] = useState<SearchOption[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
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

  const listId = `${id}-list`;
  // Moins de 2 caractères : pas de suggestions (dérivé, sans état supplémentaire).
  const shown = q.trim().length >= 2 ? options : [];
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
          onChange={(e) => setQ(e.target.value)}
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
      </div>
      <ul id={listId} role="listbox" className="sl-search-list" hidden={!open || q.trim().length < 2}>
        {shown.length === 0 && !loading && <li className="sl-search-empty">Aucun lycée trouvé pour « {q.trim()} ».</li>}
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
                  ? `${o.city} — ${o.postalCode}`
                  : `Ville · ${o.count} ${o.count > 1 ? "lycées" : "lycée"}`}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
