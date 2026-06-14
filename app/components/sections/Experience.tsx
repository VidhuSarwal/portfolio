'use client';

import { useEffect, useRef, useState } from 'react';
import { siteConfig } from '@/lib/config';
import { experiences } from '@/lib/experience';

const STATE_LABELS: Record<string, string> = {
  sentinal: 'PROTOTYPING',
  samsung:  'SCALING',
  gsoc:     'CONTRIBUTING',
  lkmp:     'UPSTREAMING',
};

// How much of the sticky scroll budget is reserved as freeze zones
// (no horizontal movement at start / end of the section's sticky window)
const FREEZE_START = 0.08; // 8% — approach buffer, kills diagonal feel
const FREEZE_END   = 0.14; // 14% — hold last card before section exits

export default function Experience() {
  const sectionRef    = useRef<HTMLElement>(null);
  const trackRef      = useRef<HTMLDivElement>(null);
  const lineRef       = useRef<SVGLineElement>(null);
  const pulseRef      = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [flareIdx,  setFlareIdx]  = useState(-1);

  // Spring overshoot state — composited on top of scroll-driven dashoffset
  const overshootRef    = useRef(0);   // current extra offset (px, positive = line drawn past target)
  const overshootVelRef = useRef(0);
  const overshootRafRef = useRef(0);
  const progRef         = useRef(0);
  const lineLenRef      = useRef(0);

  const visible = experiences.filter(
    (e) => e.configKey === null || siteConfig[e.configKey]
  );

  // Spring loop — runs only when there is overshoot
  function tickSpring() {
    const K = 0.18, D = 0.72;
    const f = K * (0 - overshootRef.current);
    overshootVelRef.current = overshootVelRef.current * D + f;
    overshootRef.current   += overshootVelRef.current;

    if (lineRef.current && lineLenRef.current) {
      const base   = lineLenRef.current * (1 - progRef.current);
      const offset = Math.max(0, base - overshootRef.current);
      lineRef.current.style.strokeDashoffset = String(offset);
    }

    if (Math.abs(overshootRef.current) > 0.5 || Math.abs(overshootVelRef.current) > 0.5) {
      overshootRafRef.current = requestAnimationFrame(tickSpring);
    } else {
      overshootRef.current    = 0;
      overshootVelRef.current = 0;
    }
  }

  useEffect(() => {
    const section = sectionRef.current;
    const track   = trackRef.current;
    if (!section || !track) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const count = visible.length;
    let lastIdx = -1;

    // Prime the SVG line
    if (lineRef.current) {
      const len = lineRef.current.getTotalLength?.() ?? 2400;
      lineLenRef.current = len;
      lineRef.current.style.strokeDasharray  = String(len);
      lineRef.current.style.strokeDashoffset = String(len);
    }

    function onScroll() {
      const rect       = section!.getBoundingClientRect();
      const scrollable = section!.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;

      const raw  = Math.max(0, Math.min(1, -rect.top / scrollable));
      const prog = Math.max(0, Math.min(1,
        (raw - FREEZE_START) / (1 - FREEZE_START - FREEZE_END)
      ));
      progRef.current = prog;

      const maxX = track!.scrollWidth - window.innerWidth;
      track!.style.transform = `translateX(${-maxX * prog}px)`;

      // Line offset: base from scroll + spring overshoot (spring owns update when active)
      if (lineRef.current && lineLenRef.current && overshootRef.current === 0) {
        lineRef.current.style.strokeDashoffset = String(lineLenRef.current * (1 - prog));
      }

      if (pulseRef.current) {
        pulseRef.current.style.left = `${prog * 100}%`;
      }

      const newIdx = Math.min(count - 1, Math.floor(prog * count));
      if (newIdx !== lastIdx) {
        lastIdx = newIdx;
        setActiveIdx(newIdx);

        // Node flare
        setFlareIdx(newIdx);
        setTimeout(() => setFlareIdx(-1), 500);

        // Spring overshoot: inject forward momentum
        cancelAnimationFrame(overshootRafRef.current);
        const overshootPx = lineLenRef.current * 0.06;
        overshootRef.current    = overshootPx;
        overshootVelRef.current = overshootPx * 0.12;
        overshootRafRef.current = requestAnimationFrame(tickSpring);
      }
    }

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(overshootRafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible.length]);

  const hPad = 'clamp(24px, 5.5vw, 72px)';
  const cPad = 'clamp(28px, 3.2vw, 48px)';
  const vTop = 'clamp(40px, 6vh, 64px)';
  const LINE = 'clamp(72px, 10vh, 100px)';

  return (
    /*
     * Outer section is tall (420vh) — this is the scroll budget.
     * The inner sticky container pins to the viewport for the full scroll budget,
     * which is how the horizontal animation feels slow and deliberate.
     */
    <section
      id="experience"
      ref={sectionRef}
      aria-labelledby="experience-heading"
      style={{ position: 'relative', height: '420vh' }}
    >
      {/* ── Sticky viewport holder ──────────────────────────────────────────── */}
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>

        {/* ── State label — large watermark behind active card ─────────────── */}
        <div
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 0,
            overflow: 'hidden',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              fontSize: 'clamp(64px, 9vw, 140px)',
              fontWeight: 700,
              letterSpacing: '0.22em',
              color: 'var(--text-primary)',
              opacity: 0.04,
              userSelect: 'none',
              whiteSpace: 'nowrap',
              transition: 'opacity 0.6s ease',
            }}
          >
            {STATE_LABELS[visible[activeIdx]?.id] ?? ''}
          </p>
        </div>

        {/* ── Horizontal track ────────────────────────────────────────────────── */}
        <div
          ref={trackRef}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'stretch',
            width: 'max-content',
            height: '100%',
            position: 'relative',
            willChange: 'transform',
          }}
        >
          {/* ── Subtle background grid drift ───────────────────────────────── */}
          <div
            aria-hidden
            className="grid-drift"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
                linear-gradient(var(--border-rest) 1px, transparent 1px),
                linear-gradient(90deg, var(--border-rest) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
              animation: 'gridDrift 18s linear infinite',
              opacity: 0.35,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          {/* ── Timeline rail ──────────────────────────────────────────────── */}
          <div
            style={{
              position: 'absolute',
              bottom: LINE,
              left: 0,
              width: '100%',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {/* Dim base line */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: '1px', background: 'var(--border-rest)',
            }} />
            {/* Progressive fill line */}
            <svg
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '1px', overflow: 'visible' }}
              preserveAspectRatio="none"
            >
              <line
                ref={lineRef}
                x1="0" y1="0" x2="100%" y2="0"
                stroke="var(--border-active)"
                strokeWidth="1"
              />
            </svg>
            {/* Traveling pulse */}
            <div
              ref={pulseRef}
              aria-hidden
              style={{
                position: 'absolute',
                top: 0,
                left: '0%',
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: 'var(--text-primary)',
                transform: 'translate(-50%, -50%)',
                opacity: 0.65,
                zIndex: 2,
              }}
            />
          </div>

          {/* ── Header panel ───────────────────────────────────────────────── */}
          <div
            style={{
              width: 'clamp(320px, 32vw, 480px)',
              flexShrink: 0,
              position: 'relative',
              borderRight: '1px solid var(--border-rest)',
              zIndex: 1,
            }}
          >
            <p
              className="text-mono"
              style={{ position: 'absolute', top: vTop, left: hPad, color: 'var(--text-secondary)' }}
            >
              04 / EXPERIENCE
            </p>

            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center',
              padding: `0 ${hPad}`,
              paddingBottom: `calc(${LINE} + 60px)`,
              paddingTop: '80px',
            }}>
              <h2
                id="experience-heading"
                className="text-section"
                style={{ color: 'var(--text-primary)' }}
              >
                Work<br />History
              </h2>
            </div>

            <p
              className="text-mono"
              style={{
                position: 'absolute',
                bottom: `calc(${LINE} - 28px)`,
                left: hPad,
                color: 'var(--text-tertiary)',
              }}
            >
              SCROLL →
            </p>
          </div>

          {/* ── Experience cards ───────────────────────────────────────────── */}
          {visible.map((exp, i) => {
            const isActive = i === activeIdx;
            const isFlare  = i === flareIdx;
            // Split "Main Title — Sub context" into two visual levels
            const [mainTitle, subTitle] = exp.role.split(' — ');

            return (
              <article
                key={exp.id}
                aria-labelledby={`exp-role-${exp.id}`}
                style={{
                  width: 'clamp(300px, 30vw, 440px)',
                  flexShrink: 0,
                  position: 'relative',
                  borderRight: i < visible.length - 1 ? '1px solid var(--border-rest)' : 'none',
                  opacity: isActive ? 1 : 0.34,
                  transition: 'opacity 0.55s ease',
                  zIndex: 1,
                }}
              >
                {/* ── Top zone: date + company ─────────────────────── */}
                <div
                  style={{
                    position: 'absolute',
                    top: vTop,
                    left: cPad,
                    right: cPad,
                    transform: isActive ? 'translateY(0px)' : 'translateY(5px)',
                    transition: 'transform 0.55s ease',
                  }}
                >
                  <p className="text-mono" style={{ color: 'var(--text-tertiary)', marginBottom: '10px' }}>
                    {exp.dateRange}
                  </p>
                  {/* Company name — bumped */}
                  <p
                    style={{
                      fontFamily: 'var(--font-display), system-ui, sans-serif',
                      fontSize: 'clamp(22px, 2.2vw, 32px)',
                      fontWeight: 700,
                      letterSpacing: '-0.015em',
                      color: 'var(--accent)',
                      lineHeight: 1.1,
                    }}
                  >
                    {exp.company}
                  </p>
                </div>

                {/* ── Lower zone: role title + sub + description + tags ── */}
                <div
                  style={{
                    position: 'absolute',
                    top: '40%',
                    bottom: `calc(${LINE} + 20px)`,
                    left: cPad,
                    right: cPad,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Main role title — large */}
                  <h3
                    id={`exp-role-${exp.id}`}
                    style={{
                      fontFamily: 'var(--font-display), system-ui, sans-serif',
                      fontSize: 'clamp(22px, 2.2vw, 32px)',
                      fontWeight: 600,
                      letterSpacing: '-0.01em',
                      color: 'var(--text-primary)',
                      lineHeight: 1.18,
                      marginBottom: subTitle ? '5px' : '12px',
                    }}
                  >
                    {mainTitle}
                  </h3>
                  {/* Sub-role context — mono, muted */}
                  {subTitle && (
                    <p
                      style={{
                        fontFamily: 'var(--font-jetbrains), monospace',
                        fontSize: '10px',
                        fontWeight: 400,
                        textTransform: 'uppercase',
                        letterSpacing: '0.13em',
                        color: 'var(--text-tertiary)',
                        marginBottom: '14px',
                      }}
                    >
                      {subTitle}
                    </p>
                  )}
                  <p
                    className="text-body"
                    style={{ color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}
                  >
                    {exp.description}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {exp.tags.map((tag) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>

                {/* ── Timeline node ─────────────────────────────────── */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: LINE,
                    left: cPad,
                    transform: 'translateY(50%)',
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Flare ring — brief brightness burst on card change */}
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      width: isFlare ? '36px' : '0px',
                      height: isFlare ? '36px' : '0px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(200,228,255,0.35) 0%, transparent 70%)',
                      opacity: isFlare ? 1 : 0,
                      transition: 'width 0.08s ease-out, height 0.08s ease-out, opacity 0.45s ease',
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      width: isActive ? '22px' : '0px',
                      height: isActive ? '22px' : '0px',
                      borderRadius: '50%',
                      border: '1px solid var(--border-active)',
                      opacity: isActive ? 0.45 : 0,
                      transition: 'width 0.45s ease, height 0.45s ease, opacity 0.45s ease',
                    }}
                  />
                  <div
                    style={{
                      width: isActive ? '9px' : '6px',
                      height: isActive ? '9px' : '6px',
                      borderRadius: '50%',
                      background: isFlare ? 'rgba(200,228,255,0.9)' : (isActive ? 'var(--text-primary)' : 'var(--border-active)'),
                      transition: 'width 0.45s ease, height 0.45s ease, background 0.45s ease',
                      boxShadow: isFlare ? '0 0 8px rgba(200,228,255,0.6)' : 'none',
                    }}
                  />
                </div>

                {/* ── Step counter ──────────────────────────────────── */}
                <p
                  className="text-mono"
                  aria-hidden
                  style={{
                    position: 'absolute',
                    bottom: `calc(${LINE} - 28px)`,
                    left: cPad,
                    opacity: isActive ? 0.7 : 0.3,
                    transition: 'opacity 0.45s ease',
                    fontSize: '9px',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  {String(i + 1).padStart(2, '0')} / {String(visible.length).padStart(2, '0')}
                </p>
              </article>
            );
          })}

          {/* Trailing spacer */}
          <div style={{ width: 'clamp(48px, 6vw, 96px)', flexShrink: 0 }} />
        </div>
      </div>
    </section>
  );
}
