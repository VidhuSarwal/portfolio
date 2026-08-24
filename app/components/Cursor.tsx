'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

const TRAIL_COUNT = 6;
const HISTORY_LENGTH = 32; // position buffer — controls trail spread

export default function Cursor() {
  const bare = usePathname() === '/lore';
  const [hasHover, setHasHover] = useState(false);
  const [label, setLabel] = useState('');

  const dotsRef = useRef<(HTMLDivElement | null)[]>([]);
  const labelRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<{ x: number; y: number }[]>([]);
  const currentRef = useRef({ x: -200, y: -200 });
  const rafRef = useRef(0);
  const labelDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setHasHover(window.matchMedia('(hover: hover)').matches);
  }, []);

  useEffect(() => {
    if (bare || !hasHover) return;

    historyRef.current = Array(HISTORY_LENGTH).fill({ x: -200, y: -200 });

    function onMouseMove(e: MouseEvent) {
      currentRef.current = { x: e.clientX, y: e.clientY };

      // Detect interactive element for label
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const target = el?.closest('a, button, [data-label]') as HTMLElement | null;

      clearTimeout(labelDebounceRef.current);
      if (target) {
        const text = target.dataset.label
          ?? (target.tagName === 'A' && (target as HTMLAnchorElement).href.startsWith('mailto') ? '[ MAIL ]' : null)
          ?? (target.tagName === 'A' ? '[ OPEN ]' : '[ SELECT ]');
        setLabel(text);
      } else {
        // slight delay on clear so label doesn't flicker during fast movement
        labelDebounceRef.current = setTimeout(() => setLabel(''), 80);
      }
    }

    function animate() {
      const pos = currentRef.current;

      // Push current position to front of history buffer
      historyRef.current = [pos, ...historyRef.current.slice(0, HISTORY_LENGTH - 1)];

      // Sample history at increasing intervals for natural spread
      // i=0 is the lead dot, spaced at 0; trail dots sampled further back
      const sampleSteps = [0, 2, 4, 7, 11, 16, 22];

      sampleSteps.slice(0, TRAIL_COUNT + 1).forEach((step, i) => {
        const dot = dotsRef.current[i];
        if (!dot) return;

        const p = historyRef.current[Math.min(step, HISTORY_LENGTH - 1)];
        const isLead = i === 0;
        const t = i / TRAIL_COUNT; // 0 = lead, 1 = tail

        const size = isLead ? 5 : Math.max(1.5, 4 - t * 2.5);
        const opacity = isLead ? 1 : Math.max(0, 0.7 - t * 0.65);

        dot.style.transform = `translate(${p.x - size / 2}px, ${p.y - size / 2}px)`;
        dot.style.width = `${size}px`;
        dot.style.height = `${size}px`;
        dot.style.opacity = String(opacity);
      });

      // Label follows lead dot with slight offset
      const labelEl = labelRef.current;
      if (labelEl) {
        labelEl.style.transform = `translate(${pos.x + 13}px, ${pos.y - 9}px)`;
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
  }, [bare, hasHover]);

  if (bare || !hasHover) return null;

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
              // Lead dot: crisp white. Trail: subtle shift toward accent
              background: isLead
                ? 'var(--text-primary)'
                : `color-mix(in srgb, var(--accent) ${Math.round((0.85 - i * 0.1) * 100)}%, transparent)`,
              pointerEvents: 'none',
              zIndex: 9999,
              willChange: 'transform',
              // No CSS transition — animation loop handles smoothness
            }}
          />
        );
      })}

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
