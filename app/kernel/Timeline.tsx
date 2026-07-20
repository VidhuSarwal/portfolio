'use client';

import { useEffect, useRef, useState } from 'react';
import { STATUS_META, toneColor, type KernelContribution } from './kernel';

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

export default function Timeline({ contributions }: { contributions: KernelContribution[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fill, setFill] = useState(0);

  // Scroll-linked axis fill + one-shot reveal. Re-runs when the filtered list
  // changes so newly-shown nodes get observed (stable patch.id keys keep
  // already-visible nodes from re-flashing).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = el.querySelectorAll<HTMLElement>('.tl-reveal');

    if (reduced) {
      setFill(1);
      items.forEach((i) => i.classList.add('is-visible'));
      return;
    }

    // Reveal — fade/slide each node in once as it enters the viewport.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );
    items.forEach((i) => io.observe(i));

    // Fill — axis line fills toward --accent as the block passes mid-viewport.
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      // Fill tracks the reading line ~72% down the viewport, so the accent
      // line reaches (near) full as the last node scrolls into view.
      const anchor = window.innerHeight * 0.72;
      setFill(clamp01((anchor - rect.top) / rect.height));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [contributions]);

  return (
    <div ref={containerRef} className="tl-track" role="list" aria-label="Kernel patch timeline">
      {/* Axis: resting line + scroll-driven accent fill */}
      <span className="tl-axis" aria-hidden="true" />
      <span className="tl-axis-fill" aria-hidden="true" style={{ transform: `scaleY(${fill})` }} />

      {contributions.map((patch) => {
        const { dot, label, tone } = STATUS_META[patch.status];
        const color = toneColor(tone);
        const merged = patch.status === 'merged';

        return (
          <div key={patch.id} role="listitem" className="tl-item tl-reveal">
            <span
              className="tl-node"
              aria-hidden="true"
              style={{ borderColor: color, background: merged ? color : 'var(--bg-base)' }}
            />

            <div className="tl-body">
              <div className="tl-meta">
                <span className="text-mono" style={{ color: 'var(--text-tertiary)' }}>
                  {patch.date}
                </span>
                <span className="tag">{patch.subsystem}</span>
                <span
                  className="text-mono"
                  style={{ color, display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  {dot} {label}
                </span>
                {patch.version && (
                  <span className="text-mono" style={{ color: 'var(--text-tertiary)' }}>
                    {patch.version}
                  </span>
                )}
              </div>

              <div className="tl-title-row">
                <p
                  className="text-body"
                  style={{ color: 'var(--text-primary)', fontWeight: 500, margin: 0, flex: '1 1 0', minWidth: 0 }}
                >
                  {patch.title}
                </p>
                <a
                  href={patch.lore_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mono tl-lore"
                >
                  <span aria-hidden="true">↗</span> LORE.KERNEL.ORG
                </a>
              </div>

              <p className="text-body" style={{ color: 'var(--text-secondary)', margin: 0, maxWidth: '72ch' }}>
                {patch.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
