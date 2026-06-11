'use client';

import { useEffect, useRef, useState } from 'react';

/* ─── 1. Dot 1:1 ──────────────────────────────────────────────────── */
function Dot1to1({ active }: { active: boolean }) {
  const dotRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!active) return;
    const dot = dotRef.current;
    if (!dot) return;
    function move(e: MouseEvent) {
      dot!.style.transform = `translate(${e.clientX - 3}px, ${e.clientY - 3}px)`;
    }
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [active]);
  if (!active) return null;
  return (
    <div ref={dotRef} style={{
      position: 'fixed', top: 0, left: 0, width: 6, height: 6,
      borderRadius: '50%', background: '#F4F4F2',
      pointerEvents: 'none', zIndex: 9999, willChange: 'transform',
    }} />
  );
}

/* ─── 2. Ghost trail ──────────────────────────────────────────────── */
function GhostTrail({ active }: { active: boolean }) {
  const trailRef = useRef<HTMLDivElement[]>([]);
  const positionsRef = useRef<{ x: number; y: number }[]>([]);
  const COUNT = 6;

  useEffect(() => {
    if (!active) return;
    positionsRef.current = Array(COUNT).fill({ x: -99, y: -99 });
    function move(e: MouseEvent) {
      positionsRef.current = [{ x: e.clientX, y: e.clientY }, ...positionsRef.current.slice(0, COUNT - 1)];
      positionsRef.current.forEach((pos, i) => {
        const el = trailRef.current[i];
        if (!el) return;
        const size = Math.max(2, 7 - i);
        el.style.transform = `translate(${pos.x - size / 2}px, ${pos.y - size / 2}px)`;
        el.style.opacity = String(1 - i / COUNT);
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
      });
    }
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [active]);

  if (!active) return null;
  return (
    <>
      {Array.from({ length: COUNT }).map((_, i) => (
        <div key={i} ref={el => { if (el) trailRef.current[i] = el; }} style={{
          position: 'fixed', top: 0, left: 0,
          borderRadius: '50%', background: '#F4F4F2',
          pointerEvents: 'none', zIndex: 9999, willChange: 'transform, opacity',
          transition: 'opacity 0.08s',
        }} />
      ))}
    </>
  );
}

/* ─── 3. Magnetic dot ─────────────────────────────────────────────── */
function MagneticDot({ active }: { active: boolean }) {
  const dotRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -99, y: -99 });
  const rafRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    const dot = dotRef.current;
    if (!dot) return;
    function move(e: MouseEvent) { posRef.current = { x: e.clientX, y: e.clientY }; }
    function animate() {
      let tx = posRef.current.x;
      let ty = posRef.current.y;
      // Snap to nearest interactive element within 40px
      const els = document.elementsFromPoint(tx, ty);
      for (const el of els) {
        if (el.matches('a, button, [data-magnetic]')) {
          const rect = (el as HTMLElement).getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dist = Math.hypot(cx - tx, cy - ty);
          if (dist < 48) {
            const pull = 1 - dist / 48;
            tx = tx + (cx - tx) * pull * 0.6;
            ty = ty + (cy - ty) * pull * 0.6;
          }
          break;
        }
      }
      dot!.style.transform = `translate(${tx - 4}px, ${ty - 4}px)`;
      rafRef.current = requestAnimationFrame(animate);
    }
    window.addEventListener('mousemove', move);
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('mousemove', move);
      cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  if (!active) return null;
  return (
    <div ref={dotRef} style={{
      position: 'fixed', top: 0, left: 0, width: 8, height: 8,
      borderRadius: '50%', background: '#C8E4FF',
      pointerEvents: 'none', zIndex: 9999, willChange: 'transform',
    }} />
  );
}

/* ─── 4. Label cursor ─────────────────────────────────────────────── */
function LabelCursor({ active }: { active: boolean }) {
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!active) return;
    function move(e: MouseEvent) {
      if (dotRef.current) dotRef.current.style.transform = `translate(${e.clientX - 3}px, ${e.clientY - 3}px)`;
      if (labelRef.current) labelRef.current.style.transform = `translate(${e.clientX + 14}px, ${e.clientY - 8}px)`;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const interactive = el?.closest('a, button, [data-label]');
      setLabel(interactive ? ((interactive as HTMLElement).dataset.label ?? '[ VIEW ]') : '');
    }
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [active]);

  if (!active) return null;
  return (
    <>
      <div ref={dotRef} style={{
        position: 'fixed', top: 0, left: 0, width: 6, height: 6,
        borderRadius: '50%', background: '#F4F4F2',
        pointerEvents: 'none', zIndex: 9999, willChange: 'transform',
      }} />
      <div ref={labelRef} style={{
        position: 'fixed', top: 0, left: 0,
        fontFamily: 'var(--font-jetbrains), monospace',
        fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
        color: '#C8E4FF', background: 'rgba(8,8,8,0.8)',
        padding: '3px 7px', borderRadius: '2px',
        opacity: label ? 1 : 0, transition: 'opacity 0.15s',
        pointerEvents: 'none', zIndex: 9999, willChange: 'transform',
        whiteSpace: 'nowrap',
      }}>
        {label || '[ EXPLORE ]'}
      </div>
    </>
  );
}

/* ─── Demo page ───────────────────────────────────────────────────── */
const cursors = ['dot-1to1', 'ghost-trail', 'magnetic', 'label'] as const;
type CursorType = typeof cursors[number];

const labels: Record<CursorType, string> = {
  'dot-1to1': 'Dot 1:1',
  'ghost-trail': 'Ghost Trail',
  'magnetic': 'Magnetic Dot',
  'label': 'Label Cursor',
};

const descriptions: Record<CursorType, string> = {
  'dot-1to1': 'A 6px white dot that follows your cursor perfectly with zero lag. Minimal, barely there.',
  'ghost-trail': 'Dot leaves 6 fading ghost positions behind it. Feels fluid on fast movement.',
  'magnetic': 'Dot snaps toward nearby buttons/links when within ~48px. Satisfying pull effect.',
  'label': 'Dot + a small mono label that appears beside interactive elements on hover.',
};

export default function CursorDemoClient() {
  const [active, setActive] = useState<CursorType>('dot-1to1');

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#F4F4F2', fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
      {/* Cursor renderers */}
      <Dot1to1 active={active === 'dot-1to1'} />
      <GhostTrail active={active === 'ghost-trail'} />
      <MagneticDot active={active === 'magnetic'} />
      <LabelCursor active={active === 'label'} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 40px' }}>
        <p style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8A8A88', marginBottom: 16 }}>
          CURSOR DEMO
        </p>
        <h1 style={{ fontFamily: 'var(--font-cabinet), system-ui', fontSize: 48, fontWeight: 700, marginBottom: 8 }}>
          Pick your cursor style.
        </h1>
        <p style={{ color: '#8A8A88', marginBottom: 56, lineHeight: 1.6 }}>
          Move your mouse around. Hover the buttons below to see interactive states.
        </p>

        {/* Style switcher */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 64 }}>
          {cursors.map((c) => (
            <button
              key={c}
              data-label={`[ ${labels[c].toUpperCase()} ]`}
              data-magnetic
              onClick={() => setActive(c)}
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '10px 20px',
                border: `1px solid ${active === c ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.1)'}`,
                background: active === c ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: active === c ? '#F4F4F2' : '#8A8A88',
                cursor: 'none',
                borderRadius: 2,
                transition: 'all 0.15s',
              }}
            >
              {labels[c]}
            </button>
          ))}
        </div>

        {/* Description */}
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: 24, marginBottom: 64 }}>
          <p style={{ fontSize: 20, fontWeight: 500, marginBottom: 8 }}>{labels[active]}</p>
          <p style={{ color: '#8A8A88', lineHeight: 1.6 }}>{descriptions[active]}</p>
        </div>

        {/* Interactive targets */}
        <p style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4A4A48', marginBottom: 24 }}>
          HOVER THESE TO TEST INTERACTIVE STATES
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 80 }}>
          <a href="#" data-label="[ VIEW WORK ]" data-magnetic onClick={e => e.preventDefault()} style={{
            fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '12px 24px', border: '1px solid rgba(255,255,255,0.45)',
            color: '#F4F4F2', textDecoration: 'none', borderRadius: 2,
          }}>
            VIEW WORK →
          </a>
          <a href="#" data-label="[ CONTACT ]" data-magnetic onClick={e => e.preventDefault()} style={{
            fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: '#8A8A88', textDecoration: 'none',
          }}>
            GET IN TOUCH
          </a>
          <a href="#" data-label="[ GSoC 25 ]" data-magnetic onClick={e => e.preventDefault()} style={{
            fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: '#C8E4FF', textDecoration: 'none',
          }}>
            ↗ CASE STUDY
          </a>
        </div>

        <a href="/" style={{
          fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: '#4A4A48', textDecoration: 'none',
        }}>
          ← BACK TO PORTFOLIO
        </a>
      </div>
    </div>
  );
}
