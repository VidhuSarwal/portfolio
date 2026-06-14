'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

// ─── Curated vocabulary — 1–2 chars preferred, 3 max, no overflow at CELL_W=10 ─
const TOKENS: readonly string[] = [
  '[]', '{}', '()', '<>', '||', '==', '!=', '&&', '::', '..', '--',
  '=>', '->', '0x', '_', 'C', '0', '1',
  'SYS', 'API', 'ETH', 'RAM', 'CPU', 'ENV', 'PTR', 'LOG',
  'GIT', 'AST', 'RAG', 'HAL', 'SDK', 'I2C', 'SPI',
];

const FONT_PX  = 8;
const CELL_W   = 10;
const CELL_H   = 12;
const BG       = '#080808';   // matches --bg-base dark
const ALPHA_IN  = 1.00;       // inside text — full white for maximum contrast
const ALPHA_OUT = 0.04;       // outside text

// Phase timings (ms)
const P1_LEN   = 400;   // noise
const P2_LEN   = 1100;  // emergence (total formation ≈ 1800ms)
const P3_LEN   = 300;   // lock flash

const NAV_LINKS = [
  { label: 'Hero',    href: '#hero' },
  { label: 'About',   href: '#about' },
  { label: 'Work',    href: '#work' },
  { label: 'Skills',  href: '#skills' },
  { label: 'SBC',     href: '#sbc-showcase' },
  { label: 'Contact', href: '#contact' },
] as const;

const SOCIAL_LINKS = [
  { label: 'GitHub',   href: 'https://github.com/VidhuSarwal' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/vidhusarwal' },
] as const;

// ─── Coverage → alpha: sharp step with narrow edge band ──────────────────────
// cov=0 → outside (0.04); cov>=0.6 → inside (1.00); narrow ramp for crisp edges
function coverageToAlpha(cov: number): number {
  if (cov <= 0) return ALPHA_OUT;
  if (cov >= 0.6) return ALPHA_IN;
  const t = cov / 0.6;
  return ALPHA_OUT + t * t * (ALPHA_IN - ALPHA_OUT);
}

// ─── Style helpers ─────────────────────────────────────────────────────────────
type LabelPos = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

function labelStyle(pos: LabelPos): CSSProperties {
  const base: CSSProperties = {
    position: 'absolute',
    fontFamily: 'var(--font-jetbrains), monospace',
    fontSize: '9px',
    letterSpacing: '0.13em',
    textTransform: 'uppercase',
    color: 'var(--text-tertiary)',
    opacity: 0.28,
    lineHeight: 1,
    pointerEvents: 'none',
    userSelect: 'none',
  };
  const p = '16px';
  switch (pos) {
    case 'top-left':     return { ...base, top: p, left: p };
    case 'top-right':    return { ...base, top: p, right: p };
    case 'bottom-left':  return { ...base, bottom: p, left: p };
    case 'bottom-right': return { ...base, bottom: p, right: p };
  }
}

const linkBase: CSSProperties = {
  fontFamily: 'var(--font-jetbrains), monospace',
  fontSize: '10px',
  letterSpacing: '0.14em',
  color: 'var(--text-tertiary)',
  textDecoration: 'none',
  textTransform: 'uppercase',
  transition: 'color 0.2s',
};

function onEnter(e: React.MouseEvent<HTMLAnchorElement>) {
  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)';
}
function onLeave(e: React.MouseEvent<HTMLAnchorElement>) {
  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-tertiary)';
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function VXFooter() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [labelsVisible, setLabelsVisible] = useState(false);
  const [isMobile, setIsMobile]           = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Engine state ──────────────────────────────────────────────────────────
    let W = 0, H = 0, animId = 0, lastTs = 0;
    let numCols = 0, numRows = 0;

    // Per-cell flat arrays (index = row * numCols + col)
    let cellChars       : string[]     = [];
    let cellTimer       : Float32Array = new Float32Array(0);
    let cellCoverage    : Float32Array = new Float32Array(0); // 0–1 proximity to text
    let cellFlash       : Float32Array = new Float32Array(0);
    // Per-cell reveal (VX. emerges before Works — row-aware)
    let cellRevealDelay : Float32Array = new Float32Array(0);
    let cellRevealProg  : Float32Array = new Float32Array(0);

    // Per-column flicker (packet-loss effect on inside columns)
    let colFlickerOn : Uint8Array   = new Uint8Array(0);
    let colFlickerT  : Float32Array = new Float32Array(0);

    // phase: 0=idle 1=noise 2=emerge 3=lock 4=steady
    let phase         = 0;
    let phaseStart    = 0;
    let resizeFast    = false;
    let started       = false;
    let nextFlickerAt = 0;

    // Scan-line state
    let scanY      = -1.0;
    let nextScanAt = 0;

    // ── Mouse / parallax state ────────────────────────────────────────────────
    const CURSOR_R     = 130;  // spotlight radius (px)
    const ALPHA_BOOST  = 0.22; // max boost for outside-text cells
    const PAR_RANGE    = 3;    // max parallax offset (px)
    const canHover     = window.matchMedia('(hover: hover)').matches;
    let rawMX = -9999, rawMY = -9999;
    let smMX  = -9999, smMY  = -9999; // lerped cursor

    // Reduced-motion sync flags
    let hasSize = false, hasIntersected = false;

    function pick() { return TOKENS[Math.floor(Math.random() * TOKENS.length)]; }

    // ── Mask: single-line "VX. Works" centered in canvas ─────────────────────
    function buildMask(w: number, h: number) {
      const mc = document.createElement('canvas');
      mc.width = w; mc.height = h;
      const mx = mc.getContext('2d')!;

      // Scale font so "VX. Works" spans ~77% of canvas width
      let fSz = 100;
      mx.font = `800 ${fSz}px "JetBrains Mono", monospace`;
      const raw = mx.measureText('VX. Works').width;
      fSz = Math.floor(fSz * (w * 0.96) / Math.max(1, raw));
      fSz = Math.max(20, Math.min(fSz, Math.floor(h * 0.82)));

      mx.font = `800 ${fSz}px "JetBrains Mono", monospace`;
      mx.fillStyle = '#fff';
      mx.textAlign = 'left';
      mx.textBaseline = 'middle';

      // Draw parts separately with a tight gap (30% of font size)
      // instead of the full monospace space character (~60% of font size)
      const vxW    = mx.measureText('VX.').width;
      const worksW = mx.measureText('Works').width;
      const gap    = fSz * 0.30;
      const startX = (w - vxW - gap - worksW) / 2;
      mx.fillText('VX.', startX, h / 2);
      mx.fillText('Works', startX + vxW + gap, h / 2);

      const data = mx.getImageData(0, 0, w, h).data;

      // 5-point kernel per cell → coverage float 0–1
      // Spread radius ≈ 45% of cell width gives hard edges spanning ~1 cell
      const r = CELL_W * 0.45;
      for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
          const idx = row * numCols + col;
          const cx  = col * CELL_W + CELL_W / 2;
          const cy  = row * CELL_H + CELL_H / 2;
          const pts: [number, number][] = [
            [cx, cy],
            [cx - r, cy], [cx + r, cy],
            [cx, cy - r], [cx, cy + r],
          ];
          let hits = 0;
          for (const [px, py] of pts) {
            const bx = Math.max(0, Math.min(w - 1, Math.round(px)));
            const by = Math.max(0, Math.min(h - 1, Math.round(py)));
            if (data[(by * w + bx) * 4 + 3] > 64) hits++;
          }
          cellCoverage[idx] = hits / 5;
        }
      }
    }

    // ── Grid / column init ────────────────────────────────────────────────────
    function initGrid(w: number, h: number) {
      numCols = Math.max(1, Math.floor(w / CELL_W));
      numRows = Math.max(1, Math.floor(h / CELL_H));
      const total = numCols * numRows;

      cellChars       = Array.from({ length: total }, pick);
      cellTimer       = new Float32Array(total);
      cellCoverage    = new Float32Array(total);
      cellFlash       = new Float32Array(total);
      cellRevealDelay = new Float32Array(total);
      cellRevealProg  = new Float32Array(total);
      colFlickerOn    = new Uint8Array(numCols);
      colFlickerT     = new Float32Array(numCols);

      for (let i = 0; i < total; i++) cellTimer[i] = Math.random() * 120;

      // Left-to-right reveal: 0–800ms spread across columns, ±40ms per-cell jitter
      // "VX." naturally leads (leftmost columns), "Works" follows (rightmost)
      for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
          const idx     = row * numCols + col;
          const colFrac = col / Math.max(1, numCols - 1);
          cellRevealDelay[idx] = colFrac * 800 + (Math.random() - 0.5) * 80;
        }
      }

      buildMask(w, h);

      // Rebuild after fonts are confirmed loaded — prevents wrong-font mask
      if (typeof document !== 'undefined' && document.fonts?.ready) {
        document.fonts.ready.then(() => { if (W && H && numCols > 0) buildMask(W, H); });
      }
    }

    // ── Alpha per cell ────────────────────────────────────────────────────────
    function cellAlpha(idx: number, col: number, phase2Elapsed: number): number {
      const cov = cellCoverage[idx];

      if (phase === 1) return 0.08;

      if (phase === 2) {
        // Side-effect: advance revealProg for this cell
        const localT = Math.max(0, phase2Elapsed - cellRevealDelay[idx]);
        cellRevealProg[idx] = Math.min(1, localT / 400); // 400ms per-cell emerge
        const target = coverageToAlpha(cov);
        return ALPHA_OUT + cellRevealProg[idx] * (target - ALPHA_OUT);
      }

      if (phase === 3 || phase === 4) {
        let a = coverageToAlpha(cov);
        if (cov >= 0.5 && cellFlash[idx] > 0) a = a + (1 - a) * cellFlash[idx];
        if (cov >= 0.5 && colFlickerOn[col])  a = ALPHA_OUT;
        return a;
      }

      return ALPHA_OUT;
    }

    // ── Packet-loss flicker (per column) ──────────────────────────────────────
    function tickFlicker(now: number, dt: number) {
      if (phase < 4) return;

      for (let col = 0; col < numCols; col++) {
        if (colFlickerOn[col]) {
          colFlickerT[col] -= dt * (1000 / 60);
          if (colFlickerT[col] <= 0) colFlickerOn[col] = 0;
        }
      }

      if (now < nextFlickerAt) return;

      // Columns that have significant inside/edge cells
      const pool: number[] = [];
      for (let col = 0; col < numCols; col++) {
        if (colFlickerOn[col]) continue;
        let hasInside = false;
        for (let row = 0; row < numRows; row++) {
          if (cellCoverage[row * numCols + col] >= 0.5) { hasInside = true; break; }
        }
        if (hasInside) pool.push(col);
      }

      const count = 3 + Math.floor(Math.random() * 4);
      for (let k = 0; k < count && pool.length; k++) {
        const r   = Math.floor(Math.random() * pool.length);
        const col = pool.splice(r, 1)[0];
        colFlickerOn[col] = 1;
        colFlickerT[col]  = 300 + Math.random() * 200;
      }
      nextFlickerAt = now + 4000 + Math.random() * 4000;
    }

    // ── rAF draw loop ─────────────────────────────────────────────────────────
    function draw(ts: number) {
      animId = requestAnimationFrame(draw);
      if (!W || !H || !started || numCols === 0) return;
      const ctx = canvas!.getContext('2d');
      if (!ctx) return;

      const dt      = lastTs > 0 ? Math.min((ts - lastTs) / (1000 / 60), 3) : 1;
      lastTs        = ts;
      const elapsed = ts - phaseStart;

      // ── Phase transitions ────────────────────────────────────────────────
      if (phase === 1) {
        const len = resizeFast ? 200 : P1_LEN;
        if (elapsed >= len) {
          if (resizeFast) {
            resizeFast = false; phase = 4;
            nextScanAt = ts + 8000 + Math.random() * 4000;
            setLabelsVisible(true);
          } else {
            phase = 2; phaseStart = ts;
          }
        }
      }

      if (phase === 2 && elapsed >= P2_LEN) {
        phase = 3; phaseStart = ts;
        const total = numCols * numRows;
        for (let i = 0; i < total; i++) {
          if (cellCoverage[i] >= 0.5) cellFlash[i] = 1.0;
        }
      }

      if (phase === 3 && elapsed >= P3_LEN) {
        phase = 4;
        nextScanAt = ts + 8000 + Math.random() * 4000;
        setLabelsVisible(true);
      }

      // ── Flash decay ──────────────────────────────────────────────────────
      if (phase >= 3) {
        const total = numCols * numRows;
        for (let i = 0; i < total; i++) {
          if (cellFlash[i] > 0) cellFlash[i] = Math.max(0, cellFlash[i] - 0.025 * dt);
        }
      }

      tickFlicker(ts, dt);

      // ── Lerp cursor toward raw position ──────────────────────────────────
      if (!reduced && canHover) {
        const lf = 0.11;
        smMX = smMX < -900 ? rawMX : smMX + (rawMX - smMX) * lf;
        smMY = smMY < -900 ? rawMY : smMY + (rawMY - smMY) * lf;
      }

      // ── Parallax: tiny ctx offset opposite cursor ─────────────────────────
      const isHovering = canHover && rawMX > -900;
      const parX = isHovering ? ((smMX / W) - 0.5) * -PAR_RANGE : 0;
      const parY = isHovering ? ((smMY / H) - 0.5) * -PAR_RANGE : 0;

      // ── Full repaint — no trail, static dense grid ───────────────────────
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.translate(parX, parY);
      ctx.font         = `${FONT_PX}px "JetBrains Mono", monospace`;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'top';

      const p2e = phase === 2 ? elapsed : 0;

      for (let row = 0; row < numRows; row++) {
        const cy = row * CELL_H + CELL_H / 2;
        const y  = row * CELL_H;
        for (let col = 0; col < numCols; col++) {
          const idx = row * numCols + col;

          // Slow character cycling — inside/edge cells refresh faster
          cellTimer[idx] -= dt;
          if (cellTimer[idx] <= 0) {
            cellChars[idx] = pick();
            cellTimer[idx] = cellCoverage[idx] > 0.3
              ? (80  + Math.random() * 120)
              : (200 + Math.random() * 200);
          }

          let a = cellAlpha(idx, col, p2e);

          // ── Spotlight: boost outside/edge cells near cursor ────────────
          if (isHovering && phase === 4 && cellCoverage[idx] < 0.5) {
            const cx   = col * CELL_W + CELL_W / 2;
            const dist = Math.sqrt((cx - smMX) * (cx - smMX) + (cy - smMY) * (cy - smMY));
            if (dist < CURSOR_R) {
              const t    = 1 - dist / CURSOR_R;
              const boost = t * t * ALPHA_BOOST;
              a = Math.min(1, a + boost);
            }
          }

          if (a < 0.004) continue;

          ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
          ctx.fillText(cellChars[idx], col * CELL_W, y);
        }
      }
      ctx.restore();

      // ── Scan line: faint horizontal sweep every 8–12 seconds ────────────
      if (phase === 4) {
        if (scanY < 0 && ts >= nextScanAt) scanY = 0;
        if (scanY >= 0) {
          // Traverse full height in ~4 seconds at 60fps
          scanY += (H / 240) * dt;
          if (scanY > H + 2) {
            scanY = -1;
            nextScanAt = ts + 8000 + Math.random() * 4000;
          } else {
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(0, Math.round(scanY) - 1, W, 2);
          }
        }
      }
    }

    // ── Reduced-motion: single static frame ───────────────────────────────────
    function drawStatic() {
      const ctx = canvas!.getContext('2d');
      if (!ctx || !W || !H || numCols === 0) return;
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
      ctx.font         = `${FONT_PX}px "JetBrains Mono", monospace`;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'top';
      for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
          const idx = row * numCols + col;
          const a   = coverageToAlpha(cellCoverage[idx]);
          if (a < 0.004) continue;
          ctx.fillStyle = `rgba(255,255,255,${a})`;
          ctx.fillText(cellChars[idx], col * CELL_W, row * CELL_H);
        }
      }
      setLabelsVisible(true);
    }

    function maybeStatic() {
      if (hasSize && hasIntersected && reduced) drawStatic();
    }

    // ── ResizeObserver ────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      W = canvas!.offsetWidth;
      H = canvas!.offsetHeight;
      if (!W || !H) return;
      canvas!.width  = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      const ctx = canvas!.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      initGrid(W, H);
      hasSize = true;
      if (started && !reduced) {
        phase      = 1;
        phaseStart = performance.now();
        resizeFast = true;
        scanY      = -1;
        setLabelsVisible(false);
      }
      maybeStatic();
    });
    ro.observe(canvas);

    // ── Mouse tracking ────────────────────────────────────────────────────────
    function onMouseMove(e: MouseEvent) {
      if (!canHover) return;
      const rect = canvas!.getBoundingClientRect();
      rawMX = e.clientX - rect.left;
      rawMY = e.clientY - rect.top;
    }
    function onMouseLeave() { rawMX = -9999; rawMY = -9999; }
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    // ── IntersectionObserver ──────────────────────────────────────────────────
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !started) {
        started = true; hasIntersected = true;
        if (reduced) {
          maybeStatic();
        } else {
          phase         = 1;
          phaseStart    = performance.now();
          nextFlickerAt = phaseStart + 6000 + Math.random() * 2000;
        }
      }
    }, { threshold: 0.1 });
    io.observe(container);

    if (!reduced) animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  // ── JSX ──────────────────────────────────────────────────────────────────────
  return (
    // Top margin separates footer from Contact section content
    <div ref={containerRef} style={{ background: 'var(--bg-base)', marginTop: 'clamp(60px, 8vh, 100px)' }}>

      {/* ── Instrumentation frame — inset from viewport edges ───────────── */}
      <div
        style={{
          position: 'relative',
          margin: '0 clamp(24px, 4vw, 72px)',   // side inset matching Respan reference
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Corner bracket — TL */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: -1, left: -1, zIndex: 2,
          width: 20, height: 20,
          borderTop: '1px solid rgba(255,255,255,0.24)',
          borderLeft: '1px solid rgba(255,255,255,0.24)',
          pointerEvents: 'none',
        }} />
        {/* Corner bracket — TR */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: -1, right: -1, zIndex: 2,
          width: 20, height: 20,
          borderTop: '1px solid rgba(255,255,255,0.24)',
          borderRight: '1px solid rgba(255,255,255,0.24)',
          pointerEvents: 'none',
        }} />
        {/* Corner bracket — BL */}
        <div aria-hidden="true" style={{
          position: 'absolute', bottom: -1, left: -1, zIndex: 2,
          width: 20, height: 20,
          borderBottom: '1px solid rgba(255,255,255,0.24)',
          borderLeft: '1px solid rgba(255,255,255,0.24)',
          pointerEvents: 'none',
        }} />
        {/* Corner bracket — BR */}
        <div aria-hidden="true" style={{
          position: 'absolute', bottom: -1, right: -1, zIndex: 2,
          width: 20, height: 20,
          borderBottom: '1px solid rgba(255,255,255,0.24)',
          borderRight: '1px solid rgba(255,255,255,0.24)',
          pointerEvents: 'none',
        }} />

        {/* Calibration ticks — top edge */}
        {([0.25, 0.5, 0.75] as const).map((p) => (
          <div key={`t${p}`} aria-hidden="true" style={{
            position: 'absolute', top: 0, left: `${p * 100}%`,
            width: 1, height: 5, background: 'rgba(255,255,255,0.14)',
            zIndex: 2, pointerEvents: 'none',
          }} />
        ))}
        {/* Calibration ticks — bottom edge */}
        {([0.33, 0.67] as const).map((p) => (
          <div key={`b${p}`} aria-hidden="true" style={{
            position: 'absolute', bottom: 0, left: `${p * 100}%`,
            width: 1, height: 5, background: 'rgba(255,255,255,0.10)',
            zIndex: 2, pointerEvents: 'none',
          }} />
        ))}

        {/* ── Canvas ────────────────────────────────────────────────────── */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            // Scales from 220px mobile to 380px desktop
            height: 'clamp(220px, calc(120px + 18vw), 380px)',
          }}
        >
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            style={{ width: '100%', height: '100%', display: 'block' }}
          />

          {/* Telemetry metadata overlay */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              opacity: labelsVisible ? 1 : 0,
              transition: 'opacity 400ms ease',
            }}
          >
            {!isMobile && <span style={labelStyle('top-left')}>Signal Complete</span>}
            {!isMobile && <span style={labelStyle('top-right')}>End of Transmission</span>}
            <span style={labelStyle('bottom-left')}>SYS · Nominal</span>
            <span style={labelStyle('bottom-right')}>VX Network · Link Established</span>
          </div>
        </div>
      </div>{/* end instrumentation frame */}

      {/* ── Footer bar — unified with canvas above ───────────────────────── */}
      <div style={{ padding: 'clamp(36px, 5vh, 56px) clamp(32px, 4vw, 64px) 32px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '32px',
            flexWrap: 'wrap',
          }}
        >
          {/* Logo */}
          <div style={{ flexShrink: 0 }}>
            <span
              style={{
                fontFamily: 'var(--font-display), system-ui, sans-serif',
                fontSize: '16px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
              }}
            >
              VX. Works
            </span>
          </div>

          {/* Section nav */}
          <nav aria-label="Footer navigation">
            <ul
              style={{
                listStyle: 'none',
                display: 'flex',
                gap: '24px',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {NAV_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} style={linkBase} onMouseEnter={onEnter} onMouseLeave={onLeave}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Socials */}
          <div style={{ display: 'flex', gap: '20px', flexShrink: 0 }}>
            {SOCIAL_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={linkBase}
                onMouseEnter={onEnter}
                onMouseLeave={onLeave}
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Copyright + build metadata */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontFamily: 'var(--font-jetbrains), monospace',
            fontSize: '9px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
            opacity: 0.45,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <span>© 2026 Vidhu Sarwal</span>
          <span style={{ opacity: 0.65 }}>VX·2026·06 / BUILD·001</span>
          <span>All rights reserved</span>
        </div>
      </div>
    </div>
  );
}
