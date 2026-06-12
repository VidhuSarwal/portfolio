'use client';

import { useEffect, useRef } from 'react';

const L = 56;  // arm length (matches --corner-length)
const O = 8;   // overshoot past corner point

// Each corner: CSS position + two SVG lines [x1,y1,x2,y2]
// Origin = the margin intersection point for that corner
type Line = [number, number, number, number];

const CORNERS: Array<{ id: string; pos: React.CSSProperties; lines: Line[] }> = [
  {
    id: 'tl',
    pos: { top: 'var(--margin-safe-area)', left: 'var(--margin-safe-area)' },
    lines: [[-O, 0, L, 0], [0, -O, 0, L]],  // H: left overshoot → right; V: top overshoot → down
  },
  {
    id: 'tr',
    pos: { top: 'var(--margin-safe-area)', right: 'var(--margin-safe-area)' },
    lines: [[-L, 0, O, 0], [0, -O, 0, L]],  // H: left arm → right overshoot; V: top overshoot → down
  },
  {
    id: 'bl',
    pos: { bottom: 'var(--margin-safe-area)', left: 'var(--margin-safe-area)' },
    lines: [[-O, 0, L, 0], [0, -L, 0, O]],  // H: left overshoot → right; V: up arm → bottom overshoot
  },
  {
    id: 'br',
    pos: { bottom: 'var(--margin-safe-area)', right: 'var(--margin-safe-area)' },
    lines: [[-L, 0, O, 0], [0, -L, 0, O]],  // H: left arm → right overshoot; V: up arm → bottom overshoot
  },
];

export default function CornerBrackets() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  // Listen for section-change events dispatched by NavOverlay
  useEffect(() => {
    function pulse() {
      refs.current.forEach(el => {
        if (!el) return;
        // Remove and re-add the class to retrigger animation even on rapid section changes
        el.classList.remove('bracket-pulse');
        void el.offsetWidth;
        el.classList.add('bracket-pulse');
        // Clean up after animation completes
        const t = setTimeout(() => el.classList.remove('bracket-pulse'), 600);
        return () => clearTimeout(t);
      });
    }

    document.addEventListener('section-change', pulse);
    return () => document.removeEventListener('section-change', pulse);
  }, []);

  return (
    <>
      {CORNERS.map((corner, i) => (
        <div
          key={corner.id}
          ref={el => { refs.current[i] = el; }}
          className="corner-bracket"
          aria-hidden="true"
          style={{
            position: 'fixed',
            width: 0,
            height: 0,
            pointerEvents: 'none',
            zIndex: 9000,
            ...corner.pos,
          }}
        >
          <svg width={0} height={0} style={{ overflow: 'visible' }}>
            {corner.lines.map(([x1, y1, x2, y2], j) => (
              <line
                key={j}
                x1={x1} y1={y1}
                x2={x2} y2={y2}
                stroke="var(--text-primary)"
                strokeWidth="1"
              />
            ))}
          </svg>
        </div>
      ))}
    </>
  );
}
