'use client';

import { useEffect, useRef, useState } from 'react';

const TRAIL_COUNT = 6;
const HISTORY_LENGTH = 32;
const BRACKET_SIZE = 14; // corner-bracket arm length (px)
const BRACKET_THICKNESS = 1.5;

export default function Cursor() {
  const [hasHover, setHasHover] = useState(false);
  const [label, setLabel] = useState('');
  const [isInteractive, setIsInteractive] = useState(false);

  const dotsRef      = useRef<(HTMLDivElement | null)[]>([]);
  const bracketRef   = useRef<HTMLDivElement>(null);
  const labelRef     = useRef<HTMLDivElement>(null);
  const historyRef   = useRef<{ x: number; y: number }[]>([]);
  const currentRef   = useRef({ x: -200, y: -200 });
  const prevRef      = useRef({ x: -200, y: -200 });
  const speedRef     = useRef(0);
  const rafRef       = useRef(0);
  const labelDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const interactiveRef   = useRef(false);

  useEffect(() => {
    setHasHover(window.matchMedia('(hover: hover)').matches);
  }, []);

  useEffect(() => {
    if (!hasHover) return;

    historyRef.current = Array(HISTORY_LENGTH).fill({ x: -200, y: -200 });

    function onMouseMove(e: MouseEvent) {
      const prev = currentRef.current;
      currentRef.current = { x: e.clientX, y: e.clientY };
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      speedRef.current = Math.min(1, Math.sqrt(dx * dx + dy * dy) / 28);

      const el = document.elementFromPoint(e.clientX, e.clientY);
      const target = el?.closest('a, button, [data-label]') as HTMLElement | null;

      clearTimeout(labelDebounceRef.current);
      if (target) {
        const text = target.dataset.label
          ?? (target.tagName === 'A' && (target as HTMLAnchorElement).href.startsWith('mailto') ? '[ MAIL ]' : null)
          ?? (target.tagName === 'A' ? '[ OPEN ]' : '[ SELECT ]');
        setLabel(text);
        if (!interactiveRef.current) { interactiveRef.current = true; setIsInteractive(true); }
      } else {
        labelDebounceRef.current = setTimeout(() => {
          setLabel('');
          interactiveRef.current = false;
          setIsInteractive(false);
        }, 80);
      }
    }

    function animate() {
      const pos = currentRef.current;
      historyRef.current = [pos, ...historyRef.current.slice(0, HISTORY_LENGTH - 1)];

      const speed   = speedRef.current;
      const isHov   = interactiveRef.current;

      // Decay speed
      speedRef.current = Math.max(0, speedRef.current - 0.04);

      const sampleSteps = [0, 2, 4, 7, 11, 16, 22];
      sampleSteps.slice(0, TRAIL_COUNT + 1).forEach((step, i) => {
        const dot = dotsRef.current[i];
        if (!dot) return;

        const p      = historyRef.current[Math.min(step, HISTORY_LENGTH - 1)];
        const isLead = i === 0;
        const t      = i / TRAIL_COUNT;

        // Lead dot shrinks when bracket is showing
        const size    = isLead ? (isHov ? 3 : 5) : Math.max(1.5, 4 - t * 2.5);
        // Trail gets brighter on fast movement
        const baseOp  = isLead ? 1 : Math.max(0, 0.7 - t * 0.65);
        const speedOp = !isLead ? Math.min(1, baseOp + speed * (1 - t) * 0.5) : baseOp;

        dot.style.transform = `translate(${p.x - size / 2}px, ${p.y - size / 2}px)`;
        dot.style.width     = `${size}px`;
        dot.style.height    = `${size}px`;
        dot.style.opacity   = String(speedOp);
      });

      // Corner-bracket lock indicator
      const brk = bracketRef.current;
      if (brk) {
        brk.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
      }

      const labelEl = labelRef.current;
      if (labelEl) {
        labelEl.style.transform = `translate(${pos.x + 16}px, ${pos.y - 9}px)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafRef.current);
      clearTimeout(labelDebounceRef.current);
    };
  }, [hasHover]);

  if (!hasHover) return null;

  const bs = BRACKET_SIZE;
  const bt = BRACKET_THICKNESS;
  const br = 'rgba(200,228,255,1)'; // accent color for brackets

  return (
    <>
      {Array.from({ length: TRAIL_COUNT + 1 }).map((_, i) => {
        const isLead = i === 0;
        return (
          <div
            key={i}
            ref={el => { dotsRef.current[i] = el; }}
            aria-hidden="true"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              borderRadius: '50%',
              background: isLead
                ? 'var(--text-primary)'
                : `color-mix(in srgb, var(--accent) ${Math.round((0.85 - i * 0.1) * 100)}%, transparent)`,
              pointerEvents: 'none',
              zIndex: 9999,
              willChange: 'transform',
            }}
          />
        );
      })}

      {/* Corner-bracket lock indicator — appears on interactive hover */}
      <div
        ref={bracketRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          willChange: 'transform',
          opacity: isInteractive ? 1 : 0,
          transition: 'opacity 0.15s ease',
        }}
      >
        {/* TL */ }
        <div style={{ position: 'absolute', left: -(bs + 4), top: -(bs + 4), width: bs, height: bs, borderTop: `${bt}px solid ${br}`, borderLeft: `${bt}px solid ${br}` }} />
        {/* TR */}
        <div style={{ position: 'absolute', right: -(bs + 4), top: -(bs + 4), width: bs, height: bs, borderTop: `${bt}px solid ${br}`, borderRight: `${bt}px solid ${br}` }} />
        {/* BL */}
        <div style={{ position: 'absolute', left: -(bs + 4), bottom: -(bs + 4), width: bs, height: bs, borderBottom: `${bt}px solid ${br}`, borderLeft: `${bt}px solid ${br}` }} />
        {/* BR */}
        <div style={{ position: 'absolute', right: -(bs + 4), bottom: -(bs + 4), width: bs, height: bs, borderBottom: `${bt}px solid ${br}`, borderRight: `${bt}px solid ${br}` }} />
      </div>

      {/* Label */}
      <div
        ref={labelRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          fontFamily: 'var(--font-jetbrains), monospace',
          fontSize: '10px',
          letterSpacing: '0.13em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          background: 'color-mix(in srgb, var(--bg-base) 90%, transparent)',
          border: '1px solid var(--border-rest)',
          padding: '3px 8px',
          borderRadius: '2px',
          opacity: label ? 1 : 0,
          transition: 'opacity 0.12s ease',
          pointerEvents: 'none',
          zIndex: 9998,
          willChange: 'transform',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
    </>
  );
}
