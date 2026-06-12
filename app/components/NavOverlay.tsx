'use client';

import { useEffect, useState } from 'react';
import CelestialToggle from '@/app/components/CelestialToggle';

const SECTIONS = [
  { id: 'hero',         num: '01' },
  { id: 'transition',   num: '02' },
  { id: 'sbc-showcase', num: '03' },
  { id: 'experience',   num: '04' },
  { id: 'tech-stack',   num: '05' },
  { id: 'contact',      num: '06' },
];

export default function NavOverlay() {
  const [num, setNum] = useState('01');

  useEffect(() => {
    const obs = SECTIONS.map(({ id, num: n }) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const o = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setNum(n);
            document.dispatchEvent(new CustomEvent('section-change', { detail: n }));
          }
        },
        { rootMargin: '-45% 0px -45% 0px' }
      );
      o.observe(el);
      return o;
    });
    return () => obs.forEach(o => o?.disconnect());
  }, []);

  return (
    <>
      <a
        href="#hero"
        aria-label="Back to top"
        style={{
          position: 'fixed',
          top: 'var(--margin-safe-area)',
          left: 'var(--margin-safe-area)',
          zIndex: 50,
          fontFamily: 'var(--font-display)',
          fontSize: '18px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          textDecoration: 'none',
          letterSpacing: '-0.01em',
        }}
      >
        VX.
      </a>

      <div
        style={{
          position: 'fixed',
          top: 'var(--margin-safe-area)',
          right: 'var(--margin-safe-area)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <CelestialToggle />
        <p
          className="text-mono"
          style={{
            color: 'var(--text-tertiary)',
            transition: 'opacity 0.3s ease',
          }}
        >
          {num} / 06
        </p>
      </div>
    </>
  );
}
