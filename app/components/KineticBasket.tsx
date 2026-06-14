'use client';

import { useEffect, useRef } from 'react';
import { useIsMobile } from '@/app/hooks/useIsMobile';

// ── Geometry ──────────────────────────────────────────────────────────────────
const BH        = 68;
const CX        = 20;
const N_TWISTS  = 1.5;
const N_STRANDS = 4;
const N_PTS     = 32;
const FOCAL     = 260;
const R_MAX     = 15.0;
const TAPER_EXP = 0.50;
const TAIL_LEN  = 10;

// ── Physics ───────────────────────────────────────────────────────────────────
const POS_K    = 0.09;
const POS_D    = 0.80;
const INFL_K   = 0.045;   // how fast basket inflates on entry
const INFL_D   = 0.88;
const ROT_LERP = 0.07;

const IDLE_DEG = 65;      // deg/s while in section with no scroll
const MAX_DEG  = 520;     // deg/s at peak scroll velocity

// ── Math ──────────────────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
function easeOutQuart(t: number) { return 1 - Math.pow(1 - t, 4); }

function springStep(
  pos: number, vel: number, target: number, k: number, d: number
): [number, number] {
  const f = k * (target - pos);
  const v = vel * d + f;
  return [pos + v, v];
}

// ── 3D projection ─────────────────────────────────────────────────────────────
interface Pt2D { sx: number; sy: number; z3d: number; }

function project(x3d: number, y3d: number, z3d: number): Pt2D {
  const s = FOCAL / (FOCAL + z3d);
  return { sx: CX + x3d * s, sy: BH / 2 + (y3d - BH / 2) * s, z3d };
}

function buildStrand(k: number, R: number, rotY: number): Pt2D[] {
  const phase = k * (Math.PI / 2);
  const pts: Pt2D[] = [];
  for (let i = 0; i < N_PTS; i++) {
    const t     = i / (N_PTS - 1);
    const taper = Math.pow(Math.sin(Math.PI * t), TAPER_EXP);
    const r_eff = R * taper;
    const theta = 2 * Math.PI * N_TWISTS * t + phase + rotY;
    pts.push(project(r_eff * Math.cos(theta), t * BH, r_eff * Math.sin(theta)));
  }
  return pts;
}

function toPoints(pts: Pt2D[]): string {
  return pts.map(p => `${p.sx.toFixed(2)},${p.sy.toFixed(2)}`).join(' ');
}

function avgZ(pts: Pt2D[]): number {
  return pts[Math.floor(N_PTS / 2)].z3d;
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  marginTop?: number;
  marginBot?: number;
  offsetX?:  string;
}

export default function KineticBasket({
  marginTop = 80,
  marginBot = 80,
  offsetX   = 'var(--margin-safe-area)',
}: Props) {
  const isMobile = useIsMobile();
  const containerRef  = useRef<HTMLDivElement>(null);
  const railSvgRef    = useRef<SVGSVGElement>(null);
  const basketSvgRef  = useRef<SVGSVGElement>(null);
  const polyRefs      = useRef<(SVGPolylineElement | null)[]>(Array(N_STRANDS).fill(null));
  const capTopRef     = useRef<SVGCircleElement>(null);
  const capBotRef     = useRef<SVGCircleElement>(null);
  const rafRef        = useRef(0);

  // ── Section gating: show in #sbc-showcase, hide when #experience enters ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const sbc = document.getElementById('sbc-showcase');
    const exp = document.getElementById('experience');
    if (!sbc) return;

    let sbcIn = false;
    let expIn = false;

    function sync() {
      const show = sbcIn && !expIn;
      container!.style.transition   = show ? 'opacity 0.7s ease' : 'opacity 0.25s ease';
      container!.style.opacity      = show ? '1' : '0';
      container!.style.pointerEvents = show ? 'auto' : 'none';
    }

    const sbcObs = new IntersectionObserver(
      ([e]) => { sbcIn = e.isIntersecting; sync(); },
      { rootMargin: '-5% 0px -5% 0px', threshold: 0 }
    );
    const expObs = new IntersectionObserver(
      ([e]) => { expIn = e.isIntersecting; sync(); },
      { threshold: 0 }
    );

    sbcObs.observe(sbc);
    if (exp) expObs.observe(exp);
    return () => { sbcObs.disconnect(); expObs.disconnect(); };
  }, []);

  // ── Animation loop ────────────────────────────────────────────────────────
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const s = {
      lastScrollY: window.scrollY,
      scrollVel:   0,
      basketY:     0,
      basketVel:   0,
      rotY:        0,
      rotSpeed:    (IDLE_DEG / 60) * (Math.PI / 180),
      rotDir:      1,
      inflation:   0,
      inflVel:     0,
      prevTs:      0,
    };

    function railH() {
      return window.innerHeight - marginTop - marginBot - BH;
    }

    function scrollProgress() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
    }

    function frame(ts: number) {
      const dt = s.prevTs > 0 ? clamp((ts - s.prevTs) / 16.667, 0.1, 3) : 1;
      s.prevTs = ts;

      // ── Scroll velocity ──────────────────────────────────────────────────
      const rawDelta = window.scrollY - s.lastScrollY;
      s.lastScrollY  = window.scrollY;
      s.scrollVel    = lerp(s.scrollVel, rawDelta, 0.32);
      const absVel   = Math.abs(s.scrollVel);

      // ── Position (spring) ────────────────────────────────────────────────
      const targetY = scrollProgress() * railH();
      [s.basketY, s.basketVel] = springStep(
        s.basketY, s.basketVel, targetY, POS_K * dt, POS_D
      );

      // ── Inflation — always 1.0, spring gives graceful entry ──────────────
      [s.inflation, s.inflVel] = springStep(
        s.inflation, s.inflVel, 1.0, INFL_K * dt, INFL_D
      );
      s.inflation = clamp(s.inflation, 0, 1);

      // ── Rotation: direction from scroll, speed from velocity ─────────────
      if (absVel > 0.3) s.rotDir = rawDelta > 0 ? 1 : -1;

      const scrollDeg = easeOutQuart(clamp(absVel / 20, 0, 1)) * MAX_DEG;
      const targetDeg = Math.max(IDLE_DEG, scrollDeg);
      const targetRad = (targetDeg / 60) * (Math.PI / 180);

      s.rotSpeed = lerp(s.rotSpeed, targetRad, ROT_LERP * dt);
      s.rotY    += s.rotSpeed * s.rotDir * dt;

      const R = lerp(0, R_MAX, s.inflation);

      if (reduced) {
        applyVisuals(targetY, 0, R_MAX);
      } else {
        applyVisuals(s.basketY, s.rotY, R);
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    function applyVisuals(basketY: number, rotY: number, R: number) {
      const bsvg = basketSvgRef.current;
      if (bsvg) bsvg.style.top = `${marginTop + basketY}px`;

      const strands = Array.from({ length: N_STRANDS }, (_, k) =>
        buildStrand(k, R, rotY)
      );

      // DOM depth sort — crossing pattern changes as basket rotates
      if (bsvg && capTopRef.current) {
        const sorted = [0, 1, 2, 3].sort((a, b) => avgZ(strands[b]) - avgZ(strands[a]));
        for (const k of sorted) {
          const el = polyRefs.current[k];
          if (el) bsvg.insertBefore(el, capTopRef.current);
        }
      }

      const zRange = Math.max(R * 2, 0.001);
      const minZ   = -R;

      for (let k = 0; k < N_STRANDS; k++) {
        const poly = polyRefs.current[k];
        if (!poly) continue;
        const z     = avgZ(strands[k]);
        const depth = clamp((z - minZ) / zRange, 0, 1);
        poly.setAttribute('points',         toPoints(strands[k]));
        poly.setAttribute('stroke-opacity', lerp(1.0, 0.08, depth).toFixed(3));
        poly.setAttribute('stroke-width',   lerp(2.1, 0.50, depth).toFixed(2));
      }

      capTopRef.current?.setAttribute('cx', String(CX));
      capTopRef.current?.setAttribute('cy', '0');
      capBotRef.current?.setAttribute('cx', String(CX));
      capBotRef.current?.setAttribute('cy', String(BH));
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [marginTop, marginBot]);

  if (isMobile) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        right: offsetX,
        width: '40px',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 40,
        opacity: 0,
        transition: 'opacity 0.7s ease',
      }}
      className="scroll-spline"
      aria-hidden="true"
    >
      {/* Rail */}
      <svg
        ref={railSvgRef}
        width="40"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', pointerEvents: 'none' }}
      >
        <line
          x1={CX} y1={marginTop * 0.4}
          x2={CX} y2={`calc(100% - ${marginBot * 0.4}px)`}
          stroke="var(--border-subtle)"
          strokeWidth="1"
        />
      </svg>

      {/* Basket ornament */}
      <svg
        ref={basketSvgRef}
        width="40"
        height={BH + TAIL_LEN * 2}
        style={{
          position: 'absolute',
          left: 0,
          top: marginTop,
          overflow: 'visible',
          pointerEvents: 'none',
        }}
        viewBox={`0 0 40 ${BH + TAIL_LEN * 2}`}
      >
        {Array.from({ length: N_STRANDS }, (_, k) => (
          <polyline
            key={k}
            ref={el => { polyRefs.current[k] = el; }}
            fill="none"
            stroke="var(--text-primary)"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        <circle ref={capTopRef} cx={CX} cy={0} r="2.0"
          fill="var(--text-primary)" opacity="0.75" />
        <line x1={CX} y1={-TAIL_LEN} x2={CX} y2={0}
          stroke="var(--text-primary)" strokeWidth="1.0"
          strokeOpacity="0.45" strokeLinecap="round" />

        <circle ref={capBotRef} cx={CX} cy={BH} r="2.0"
          fill="var(--text-primary)" opacity="0.75" />
        <line x1={CX} y1={BH} x2={CX} y2={BH + TAIL_LEN}
          stroke="var(--text-primary)" strokeWidth="1.0"
          strokeOpacity="0.45" strokeLinecap="round" />
      </svg>
    </div>
  );
}
