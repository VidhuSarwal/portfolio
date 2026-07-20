'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { STATUS_META, toneColor, type KernelContribution } from './kernel';

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// Parse an ISO YYYY-MM-DD without timezone drift (manual, UTC weekday only).
function dayInfo(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return { day: String(d).padStart(2, '0'), weekday };
}

interface MonthGroup {
  key: string;      // "YYYY-MM"
  name: string;     // "July"
  year: number;
  items: KernelContribution[];
}

// Sort chronologically (oldest → newest), then bucket into consecutive months.
function groupByMonth(contributions: KernelContribution[]): MonthGroup[] {
  const sorted = [...contributions].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const groups: MonthGroup[] = [];
  for (const c of sorted) {
    const key = c.date.slice(0, 7);
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) {
      const [y, m] = key.split('-').map(Number);
      g = { key, name: MONTHS[m - 1], year: y, items: [] };
      groups.push(g);
    }
    g.items.push(c);
  }
  return groups;
}

export default function Timeline({ contributions }: { contributions: KernelContribution[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fill, setFill] = useState(0);

  const groups = useMemo(() => groupByMonth(contributions), [contributions]);

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

      {groups.map((group) => (
        <section key={group.key} className="tl-group" aria-label={`${group.name} ${group.year}`}>
          {/* Month divider — large label + diamond marker on the axis */}
          <header className="tl-month tl-reveal">
            <span className="tl-month-marker" aria-hidden="true" />
            <h2 className="tl-month-label">
              {group.name}
              <span className="tl-month-year">{group.year}</span>
            </h2>
            <span className="text-mono tl-month-count">
              {group.items.length} {group.items.length === 1 ? 'PATCH' : 'PATCHES'}
            </span>
          </header>

          {group.items.map((patch) => {
            const { dot, label, tone } = STATUS_META[patch.status];
            const color = toneColor(tone);
            const merged = patch.status === 'merged';
            const { day, weekday } = dayInfo(patch.date);

            return (
              <div key={patch.id} role="listitem" className="tl-item tl-reveal">
                <span
                  className="tl-node"
                  aria-hidden="true"
                  style={{ borderColor: color, background: merged ? color : 'var(--bg-base)' }}
                />

                <div className="tl-body">
                  <div className="tl-meta">
                    <span className="text-mono tl-day">
                      <span className="tl-day-num">{day}</span> {weekday}
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
        </section>
      ))}
    </div>
  );
}
