'use client';

import { useCallback, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useTheme } from '@/app/providers/ThemeContext';

// ── Sun ray geometry ──────────────────────────────────────────────────────────
const CX = 12, CY = 12, INNER_R = 7.2, OUTER_R = 11.2;

function pt(angleDeg: number, r: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: +(CX + r * Math.cos(a)).toFixed(3), y: +(CY + r * Math.sin(a)).toFixed(3) };
}

const RAYS = [0, 45, 90, 135, 180, 225, 270, 315].map(a => ({
  i: pt(a, INNER_R),
  o: pt(a, OUTER_R),
}));

export default function CelestialToggle() {
  const { theme, switchTheme, isAnimating, setAnimating } = useTheme();

  const btnRef        = useRef<HTMLButtonElement>(null);
  const rayRefs       = useRef<(SVGLineElement | null)[]>([]);
  const coreRef       = useRef<SVGEllipseElement>(null);
  const moonGrpRef    = useRef<SVGGElement>(null);
  const moonBodyRef   = useRef<SVGCircleElement>(null);
  const moonBiteRef   = useRef<SVGCircleElement>(null);
  const overlayRef    = useRef<SVGSVGElement>(null);
  const overlayPathRef    = useRef<SVGPathElement>(null);
  const overlayDropRef    = useRef<SVGCircleElement>(null);
  const tlRef         = useRef<gsap.core.Timeline | null>(null);

  // ── Kill timeline on unmount ────────────────────────────────────────────────
  useEffect(() => () => { tlRef.current?.kill(); }, []);

  // ── Click handler ───────────────────────────────────────────────────────────
  const handleClick = useCallback(() => {
    if (isAnimating) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      switchTheme();
      return;
    }

    setAnimating(true);

    const btnEl   = btnRef.current!;
    const coreEl  = coreRef.current!;
    const grpEl   = moonGrpRef.current!;
    const bodyEl  = moonBodyRef.current!;
    const biteEl  = moonBiteRef.current!;
    const overlEl = overlayRef.current!;
    const pathEl  = overlayPathRef.current!;
    const dropEl  = overlayDropRef.current!;

    // ── Droplet path: starts at button center-bottom, curves into page ────────
    const rect  = btnEl.getBoundingClientRect();
    const sx    = rect.left + rect.width / 2;
    const sy    = rect.bottom + 4;
    const ex    = sx - window.innerWidth * 0.16;
    const ey    = sy + window.innerHeight * 0.36;
    const cpx   = sx - window.innerWidth * 0.04;
    const cpy   = sy + window.innerHeight * 0.14;
    const pathD = `M ${sx} ${sy} Q ${cpx} ${cpy} ${ex} ${ey}`;

    pathEl.setAttribute('d', pathD);
    const totalLen = pathEl.getTotalLength();
    pathEl.style.strokeDasharray  = `${totalLen}`;
    pathEl.style.strokeDashoffset = `${totalLen}`;
    dropEl.setAttribute('cx', String(sx));
    dropEl.setAttribute('cy', String(sy));
    dropEl.setAttribute('opacity', '0');

    const prog = { t: 0 };

    function animateDroplet() {
      const d  = prog.t * totalLen;
      const p  = pathEl.getPointAtLength(d);
      dropEl.setAttribute('cx', String(p.x));
      dropEl.setAttribute('cy', String(p.y));
      pathEl.style.strokeDashoffset = String(totalLen - d);
      const fadeIn  = Math.min(prog.t * 7, 1);
      const fadeOut = prog.t > 0.76 ? Math.max(0, (1 - prog.t) / 0.24) : 1;
      dropEl.setAttribute('opacity', String(fadeIn * fadeOut));
    }

    const tl = gsap.timeline({ onComplete: () => setAnimating(false) });
    tlRef.current = tl;

    if (theme === 'dark') {
      // ── Dark → Light: sun retracts, moon rises ──────────────────────────────

      // 1. Rays retract (outer tip → inner tip, slight stagger)
      RAYS.forEach(({ i }, idx) => {
        const el = rayRefs.current[idx];
        if (!el) return;
        tl.to(el, {
          attr: { x2: i.x, y2: i.y },
          duration: 0.13,
          ease: 'power2.in',
        }, idx * 0.009);
      });

      // 2. Surface tension compress + release (scaled for r=5.2)
      tl.to(coreEl, { attr: { ry: 4.58 }, duration: 0.07, ease: 'power2.inOut' }, 0.16);
      tl.to(coreEl, { attr: { ry: 5.41 }, duration: 0.05, ease: 'power2.out'  }, 0.23);
      tl.to(coreEl, { attr: { ry: 5.2  }, duration: 0.04, ease: 'power1.out'  }, 0.28);

      // 3. Overlay on + droplet travels
      tl.call(() => { overlEl.style.opacity = '1'; }, [], 0.26);
      tl.to(prog, {
        t: 1,
        duration: 0.38,
        ease: 'power1.inOut',
        onUpdate: animateDroplet,
      }, 0.27);

      // 4. Switch theme at midpoint
      tl.call(() => {
        document.documentElement.classList.add('theme-transitioning');
        switchTheme();
        setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 600);
      }, [], 0.42);

      // 5. Sun dissolves, moon rises
      tl.set(rayRefs.current.filter(Boolean), { opacity: 0 }, 0.44);
      tl.to(coreEl,  { opacity: 0, duration: 0.09 }, 0.45);
      tl.to(bodyEl,  { opacity: 1, duration: 0.13 }, 0.50);
      tl.to(biteEl,  { opacity: 1, duration: 0.11 }, 0.59);

      // 6. Overlay fades
      tl.to(overlEl, { opacity: 0, duration: 0.11 }, 0.67);

      // 7. Moon settles with one small pulse
      tl.to(grpEl, {
        scale: 1.04, transformOrigin: '50% 50%',
        duration: 0.08, ease: 'power1.inOut',
        yoyo: true, repeat: 1,
      }, 0.74);

    } else {
      // ── Light → Dark: moon dissolves, sun rises ─────────────────────────────

      // 1. Moon bite fades, then body
      tl.to(biteEl, { opacity: 0, duration: 0.09 }, 0);
      tl.to(bodyEl, { opacity: 0, duration: 0.12 }, 0.05);

      // 2. Core outline returns
      tl.to(coreEl, { opacity: 1, duration: 0.10 }, 0.10);

      // 3. Overlay + droplet
      tl.call(() => { overlEl.style.opacity = '1'; }, [], 0.20);
      const prog2 = { t: 0 };
      tl.to(prog2, {
        t: 1,
        duration: 0.37,
        ease: 'power1.inOut',
        onUpdate() {
          const d  = prog2.t * totalLen;
          const p  = pathEl.getPointAtLength(d);
          dropEl.setAttribute('cx', String(p.x));
          dropEl.setAttribute('cy', String(p.y));
          pathEl.style.strokeDashoffset = String(totalLen - d);
          const fadeIn  = Math.min(prog2.t * 7, 1);
          const fadeOut = prog2.t > 0.76 ? Math.max(0, (1 - prog2.t) / 0.24) : 1;
          dropEl.setAttribute('opacity', String(fadeIn * fadeOut));
        },
      }, 0.21);

      // 4. Theme switch
      tl.call(() => {
        document.documentElement.classList.add('theme-transitioning');
        switchTheme();
        setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 600);
      }, [], 0.36);

      // 5. Rays extend with stagger while fading in
      RAYS.forEach(({ i, o }, idx) => {
        const el = rayRefs.current[idx];
        if (!el) return;
        tl.set(el, { attr: { x2: i.x, y2: i.y }, opacity: 0 }, 0.33 + idx * 0.005);
        tl.to(el, {
          opacity: 1,
          attr: { x2: o.x, y2: o.y },
          duration: 0.17,
          ease: 'power1.out',
        }, 0.35 + idx * 0.010);
      });

      // 6. Overlay fades
      tl.to(overlEl, { opacity: 0, duration: 0.10 }, 0.62);

      // 7. Sun core residual pulse (scaled for r=5.2)
      tl.to(coreEl, {
        attr: { rx: 5.52, ry: 5.52 },
        duration: 0.07, ease: 'power1.inOut',
      }, 0.68);
      tl.to(coreEl, {
        attr: { rx: 5.2, ry: 5.2 },
        duration: 0.09, ease: 'power2.out',
      }, 0.75);
    }
  }, [isAnimating, theme, switchTheme, setAnimating]);

  return (
    <>
      {/* ── Toggle button ─────────────────────────────────────────────────── */}
      <button
        ref={btnRef}
        onClick={handleClick}
        className="celestial-btn"
        data-animating={isAnimating || undefined}
        data-label="[ THEME ]"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-pressed={theme === 'light'}
        style={{
          background: 'none',
          border: 'none',
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          borderRadius: '50%',
          lineHeight: 0,
          color: 'var(--text-primary)',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          aria-hidden="true"
          overflow="visible"
        >
          <defs>
            <filter id="cg" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g className="celestial-icon">
            {/* ── Sun rays ───────────────────────────────────────────────── */}
            {RAYS.map(({ i, o }, idx) => (
              <line
                key={idx}
                ref={el => { rayRefs.current[idx] = el; }}
                x1={i.x} y1={i.y}
                x2={o.x} y2={o.y}
                stroke="var(--text-primary)"
                strokeWidth="0.65"
                strokeLinecap="round"
                strokeOpacity="0.52"
              />
            ))}

            {/* ── Core ellipse (sun ring + surface-tension animation) ─────── */}
            <ellipse
              ref={coreRef}
              cx={CX} cy={CY}
              rx="5.2" ry="5.2"
              fill="none"
              stroke="var(--text-primary)"
              strokeWidth="0.9"
            />

            {/* ── Moon group ──────────────────────────────────────────────── */}
            <g ref={moonGrpRef}>
              <circle
                ref={moonBodyRef}
                cx={CX} cy={CY} r="5.2"
                fill="var(--text-primary)"
                opacity="0"
              />
              {/* bite circle — filled with bg color to carve the crescent */}
              <circle
                ref={moonBiteRef}
                cx="15.0" cy="10.6" r="4.4"
                fill="var(--bg-base)"
                opacity="0"
              />
            </g>
          </g>
        </svg>
      </button>

      {/* ── Full-page droplet overlay ──────────────────────────────────────── */}
      <svg
        ref={overlayRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 9997,
          opacity: 0,
        }}
      >
        <path
          ref={overlayPathRef}
          fill="none"
          stroke="var(--text-primary)"
          strokeWidth="1.0"
          strokeOpacity="0.22"
          strokeLinecap="round"
        />
        <circle
          ref={overlayDropRef}
          r="4"
          fill="var(--text-primary)"
          opacity="0"
        />
      </svg>
    </>
  );
}
