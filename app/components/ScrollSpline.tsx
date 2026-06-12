'use client';

import { useEffect, useRef, useState } from 'react';

// ── Geometry ────────────────────────────────────────────────────────────────
const SVG_W   = 36;    // rendered px width (x viewBox = px, 1:1)
const SVG_H   = 600;   // viewBox height (y-axis stretched to CSS height)
const CX      = 28;    // x of the straight line (near right edge of SVG)

// ── Bulge shape ─────────────────────────────────────────────────────────────
const AMP_MAX  = 22;   // max lateral bow in viewBox px (leftward)
const R_REST   = 38;   // bulge half-height when amplitude is zero
const R_MAX    = 82;   // bulge half-height at full amplitude
const VEL_SCALE = 1400; // raw-scroll velocity → amplitude target

// ── Spring constants ────────────────────────────────────────────────────────
const AMP_ATTACK = 0.20;  // amplitude rises fast
const AMP_DECAY  = 0.06;  // amplitude falls slowly — long fluid tail
const POS_LERP   = 0.09;  // position trails scroll — thread-lag feel

const SECTIONS = [
  { id: 'hero',         num: '01' },
  { id: 'transition',   num: '02' },
  { id: 'sbc-showcase', num: '03' },
  { id: 'experience',   num: '04' },
  { id: 'tech-stack',   num: '05' },
  { id: 'contact',      num: '06' },
];

export default function ScrollSpline() {
  const [sectionNum, setSectionNum] = useState('01');
  const [visible, setVisible]       = useState(false);

  // ── DOM refs — rAF mutates these directly, zero React re-renders ──────────
  const deformRef = useRef<SVGPathElement>(null);  // the accent deformation
  const dotRef    = useRef<SVGCircleElement>(null);
  const labelRef  = useRef<HTMLSpanElement>(null);

  // ── Physics state ─────────────────────────────────────────────────────────
  const targetRef   = useRef(0);   // scroll progress 0–1
  const rawVelRef   = useRef(0);   // raw velocity from scroll listener
  const dispRef     = useRef(0);   // displayed position (lerped)
  const ampRef      = useRef(0);   // current bulge amplitude (springs to 0 at rest)
  const prevTopRef  = useRef(0);   // previous scrollY for velocity
  const rafRef      = useRef<number>(0);

  // ── Scroll listener — capture raw velocity here (pre-Lenis) ─────────────
  useEffect(() => {
    function onScroll() {
      const top = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;

      targetRef.current = Math.max(0, Math.min(1, top / max));
      rawVelRef.current  = Math.abs(top - prevTopRef.current) / max;
      prevTopRef.current = top;

      setVisible(top > window.innerHeight * 0.5);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Section tracker ───────────────────────────────────────────────────────
  useEffect(() => {
    const obs = SECTIONS.map(({ id, num }) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const o = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setSectionNum(num); },
        { rootMargin: '-45% 0px -45% 0px' }
      );
      o.observe(el);
      return o;
    });
    return () => obs.forEach(o => o?.disconnect());
  }, []);

  // ── rAF loop ───────────────────────────────────────────────────────────────
  useEffect(() => {
    function frame() {
      // ── Amplitude spring ────────────────────────────────────────────────
      // Velocity drives amplitude up; decays toward 0 at rest
      const velInput  = Math.min(rawVelRef.current * VEL_SCALE, AMP_MAX);
      rawVelRef.current *= 0.75;  // decay raw vel between scroll events

      const lerpA = velInput > ampRef.current ? AMP_ATTACK : AMP_DECAY;
      ampRef.current += (velInput - ampRef.current) * lerpA;

      // ── Position lerp ────────────────────────────────────────────────────
      dispRef.current += (targetRef.current - dispRef.current) * POS_LERP;

      const A  = ampRef.current;
      const dynR = R_REST + (A / AMP_MAX) * (R_MAX - R_REST);

      // Clamp wave centre so bulge never clips off the ends
      const y  = Math.max(dynR + 2, Math.min(SVG_H - dynR - 2, dispRef.current * SVG_H));
      const t  = y - dynR;           // bulge top
      const b  = y + dynR;           // bulge bottom
      const px = CX - A;             // peak x (leftward bow)

      // Cubic bezier tangent offsets — keeps entry & exit tangent vertical
      const tg = dynR * 0.55;   // tangent length along y-axis
      const pull = dynR * 0.30; // x-pull toward peak near extremes

      // Two cubic beziers: above-centre → peak, peak → below-centre
      // Entry tangent: vertical (CP1 shares x with start = CX)
      // Exit tangent: vertical (CP2 shares x with end = CX)
      const d = [
        `M ${CX} ${t}`,
        `C ${CX} ${t + tg}   ${px} ${y - pull}   ${px} ${y}`,
        `C ${px} ${y + pull}  ${CX} ${b - tg}     ${CX} ${b}`,
      ].join(' ');

      deformRef.current?.setAttribute('d', d);

      // Dot rides the geometric peak of the bezier (approx midpoint of the arc)
      const dotX = CX - A * 0.55;  // 55% of the bow, close to visual peak
      dotRef.current?.setAttribute('cx', String(dotX));
      dotRef.current?.setAttribute('cy', String(y));

      // Section label tracks wave centre
      if (labelRef.current) {
        labelRef.current.style.top = `${(y / SVG_H) * 100}%`;
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="scroll-spline"
      style={{
        position: 'fixed',
        right: '24px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 40,
        width: SVG_W,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.8s ease',
      }}
    >
      <svg
        width={SVG_W}
        style={{ height: 'clamp(260px, 58vh, 400px)', display: 'block' }}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        preserveAspectRatio="none"
        fill="none"
      >
        {/* Static base line — always straight, always dim */}
        <line x1={CX} y1={0} x2={CX} y2={SVG_H} stroke="var(--border-subtle)" strokeWidth="1" />

        {/* Fluid deformation — accent, breathes in and out with scroll velocity */}
        <path
          ref={deformRef}
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Position jewel — rides the bow peak */}
        <circle
          ref={dotRef}
          cx={CX}
          cy={0}
          r="2.5"
          fill="var(--accent)"
          opacity="0.9"
        />
      </svg>

      {/* Section number — top set by rAF, no CSS transition (would fight the loop) */}
      <span
        ref={labelRef}
        className="text-mono"
        style={{
          position: 'absolute',
          right: '100%',
          marginRight: '10px',
          transform: 'translateY(-50%)',
          color: 'var(--text-tertiary)',
          fontSize: '9px',
          letterSpacing: '0.14em',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        {sectionNum}
      </span>
    </div>
  );
}
