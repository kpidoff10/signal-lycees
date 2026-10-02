// Vignettes de partage (Open Graph) : charte du site, polices TTF embarquées.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReactNode } from "react";

export const OG_SIZE = { width: 1200, height: 630 };

const dir = join(process.cwd(), "assets/og");
const fontsPromise = Promise.all([
  readFile(join(dir, "BricolageGrotesque-Bold.ttf")),
  readFile(join(dir, "InstrumentSans-Medium.ttf")),
  readFile(join(dir, "InstrumentSans-Bold.ttf")),
]);

export async function ogFonts() {
  const [display, sans, sansBold] = await fontsPromise;
  return [
    { name: "Bricolage", data: display, weight: 700 as const, style: "normal" as const },
    { name: "Instrument", data: sans, weight: 500 as const, style: "normal" as const },
    { name: "Instrument", data: sansBold, weight: 700 as const, style: "normal" as const },
  ];
}

const C = { paper: "#f5f3ec", ink: "#18201d", muted: "#575f5b", signal: "#c2410c", soft: "#fbe4d6", border: "#d9d4c6" };

/** Points décoratifs façon carte, à droite de la vignette. */
function Dots() {
  const dots = [
    [930, 120, 22], [1010, 190, 14], [880, 250, 32], [1060, 300, 18], [960, 360, 14],
    [1110, 150, 12], [840, 410, 18], [1030, 440, 26], [920, 500, 12], [1120, 400, 14],
  ];
  return (
    <>
      {dots.map(([x, y, r], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x! - r!,
            top: y! - r!,
            width: r! * 2,
            height: r! * 2,
            borderRadius: 999,
            background: C.signal,
            border: "4px solid white",
            boxShadow: `0 0 0 ${Math.round(r! / 2)}px ${C.soft}`,
          }}
        />
      ))}
    </>
  );
}

export function OgFrame({ eyebrow, title, chips, footer }: { eyebrow: string; title: string; chips: ReactNode[]; footer: string }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: C.paper, fontFamily: "Instrument", color: C.ink }}>
      <Dots />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", width: 820, height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: "Bricolage", fontSize: 36 }}>
          <div style={{ width: 26, height: 26, borderRadius: 999, background: C.signal, boxShadow: `0 0 0 8px ${C.soft}` }} />
          Signal Lycées
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.signal, letterSpacing: 1 }}>{eyebrow.toUpperCase()}</div>
          <div style={{ fontFamily: "Bricolage", fontSize: title.length > 40 ? 58 : 70, lineHeight: 1.05, letterSpacing: -1.5 }}>{title}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>{chips}</div>
        </div>
        <div style={{ fontSize: 26, color: C.muted }}>{footer}</div>
      </div>
    </div>
  );
}

export function OgChip({ children, strong }: { children: ReactNode; strong?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 20px",
        borderRadius: 999,
        fontSize: 26,
        fontWeight: 700,
        background: strong ? C.signal : "white",
        color: strong ? "white" : C.ink,
        border: strong ? "none" : `2px solid ${C.border}`,
      }}
    >
      {children}
    </div>
  );
}
