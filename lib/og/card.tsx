import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ReactNode } from 'react';

// Shared chrome for the generated social cards (opengraph-image / twitter-image).
//
// Satori renders these, not the browser, so CSS custom properties don't
// resolve — values below mirror the light-theme tokens in globals.css and the
// Loader's black-on-white blueprint. Same exemption as canvas `ctx` calls.
export const OG = {
  bg: '#FFFFFF',
  ink: '#0A0A0A',
  secondary: '#6B6865',
  tertiary: '#B5B2AB',
  accent: '#2C5282',
  hairline: 'rgba(0, 0, 0, 0.10)',
  grid: 'rgba(0, 0, 0, 0.045)',
} as const;

export const OG_SIZE = { width: 1200, height: 630 };

const INSET = 36;       // bracket offset from the card edge
const CORNER = 56;      // --corner-length
const STROKE = 3;
const CELL = 42;        // blueprint grid pitch

// Static (non-variable) WOFF instances — Satori can't read woff2 and renders
// only the default instance of a variable font.
export async function loadOgFonts() {
  const dir = join(process.cwd(), 'lib/og/fonts');
  const [bold, medium, mono] = await Promise.all([
    readFile(join(dir, 'space-grotesk-latin-700-normal.woff')),
    readFile(join(dir, 'space-grotesk-latin-500-normal.woff')),
    readFile(join(dir, 'jetbrains-mono-latin-400-normal.woff')),
  ]);
  return [
    { name: 'Space Grotesk', data: bold, weight: 700 as const, style: 'normal' as const },
    { name: 'Space Grotesk', data: medium, weight: 500 as const, style: 'normal' as const },
    { name: 'JetBrains Mono', data: mono, weight: 400 as const, style: 'normal' as const },
  ];
}

export function Mono({ children, color = OG.ink, size = 18 }: { children: ReactNode; color?: string; size?: number }) {
  return (
    <div
      style={{
        display: 'flex',
        fontFamily: 'JetBrains Mono',
        fontSize: size,
        letterSpacing: size * 0.14,
        textTransform: 'uppercase',
        color,
      }}
    >
      {children}
    </div>
  );
}

function Grid() {
  const { width, height } = OG_SIZE;
  const xs = Array.from({ length: Math.floor(width / CELL) }, (_, i) => (i + 1) * CELL);
  const ys = Array.from({ length: Math.floor(height / CELL) }, (_, i) => (i + 1) * CELL);
  return (
    <svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
      {xs.map((x) => <line key={`x${x}`} x1={x} y1={0} x2={x} y2={height} stroke={OG.grid} strokeWidth={1} />)}
      {ys.map((y) => <line key={`y${y}`} x1={0} y1={y} x2={width} y2={y} stroke={OG.grid} strokeWidth={1} />)}
    </svg>
  );
}

function Bracket({ corner }: { corner: 'tl' | 'tr' | 'bl' | 'br' }) {
  const top = corner[0] === 't';
  const left = corner[1] === 'l';
  const edge = `${STROKE}px solid ${OG.ink}`;
  return (
    <div
      style={{
        position: 'absolute',
        width: CORNER,
        height: CORNER,
        ...(top ? { top: INSET, borderTop: edge } : { bottom: INSET, borderBottom: edge }),
        ...(left ? { left: INSET, borderLeft: edge } : { right: INSET, borderRight: edge }),
      }}
    />
  );
}

// The VX. mark from brand/vx-mark-dark.svg, rebuilt in flexbox.
export function VXMark({ size = 92 }: { size?: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        border: `${STROKE}px solid ${OG.ink}`,
        background: OG.bg,
        fontFamily: 'Space Grotesk',
        fontWeight: 700,
        fontSize: size * 0.38,
        letterSpacing: -1,
        color: OG.ink,
      }}
    >
      VX.
    </div>
  );
}

// Card frame: blueprint grid, four corner brackets, a mono header row
// (eyebrow left, URL right), then the card body filling the remaining space.
// Real content stays ≥64px from every edge — X shaves the top/bottom when it
// letterboxes large cards to 2:1 — and 80px at the bottom, where X overlays
// its domain pill.
export function CardFrame({ eyebrow, url, children }: { eyebrow: string; url: string; children: ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: OG.bg,
        color: OG.ink,
        fontFamily: 'Space Grotesk',
        padding: '64px 80px 80px 80px',
      }}
    >
      <Grid />
      <Bracket corner="tl" />
      <Bracket corner="tr" />
      <Bracket corner="bl" />
      <Bracket corner="br" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Mono color={OG.secondary}>{eyebrow}</Mono>
        <Mono>{url}</Mono>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>{children}</div>
    </div>
  );
}
