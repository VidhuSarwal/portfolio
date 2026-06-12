'use client';

import { useEffect, useRef } from 'react';
import { siteConfig } from '@/lib/config';
import { experiences } from '@/lib/experience';

export default function Experience() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef   = useRef<HTMLDivElement>(null);
  const lineRef    = useRef<SVGLineElement>(null);

  const visible = experiences.filter(
    (e) => e.configKey === null || siteConfig[e.configKey]
  );

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    async function init() {
      const gsapMod = await import('gsap');
      const stMod   = await import('gsap/ScrollTrigger');
      const gsap    = gsapMod.gsap;
      gsap.registerPlugin(stMod.ScrollTrigger);

      const section = sectionRef.current;
      const track   = trackRef.current;
      if (!section || !track) return;

      await new Promise<void>(r => setTimeout(r, 50));

      const scrollDist = track.scrollWidth - window.innerWidth;
      if (scrollDist <= 0) return;
      if (reduced) return;

      gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          pin: true,
          scrub: 1.2,
          start: 'top top',
          end: () => `+=${track.scrollWidth - window.innerWidth}`,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            if (lineRef.current) {
              const len = lineRef.current.getTotalLength?.() ?? 2400;
              lineRef.current.style.strokeDashoffset = String(len * (1 - self.progress));
            }
          },
        },
      });

      if (lineRef.current) {
        const len = lineRef.current.getTotalLength?.() ?? 2400;
        gsap.set(lineRef.current, { strokeDasharray: len, strokeDashoffset: len });
      }
    }

    init();
  }, [visible.length]);

  // Shared spacing tokens
  const hPad = 'clamp(24px, 5.5vw, 72px)';
  const cPad = 'clamp(28px, 3.2vw, 48px)';
  const vTop = 'clamp(40px, 6vh, 64px)';
  // The timeline line and dots sit at this fixed distance from the section bottom
  const LINE = 'clamp(72px, 10vh, 100px)';

  return (
    <section
      id="experience"
      ref={sectionRef}
      aria-labelledby="experience-heading"
      style={{ overflow: 'hidden' }}
    >
      <div
        ref={trackRef}
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          width: 'max-content',
          height: '100vh',
          position: 'relative',
          willChange: 'transform',
        }}
      >
        {/* ── Timeline line — spans exact track width ─────────────────────── */}
        <div
          style={{
            position: 'absolute',
            bottom: LINE,
            left: 0,
            width: '100%',
            height: '1px',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <svg
            style={{ width: '100%', height: '1px', overflow: 'visible' }}
            preserveAspectRatio="none"
          >
            <line
              ref={lineRef}
              x1="0" y1="0" x2="100%" y2="0"
              stroke="var(--border-active)"
              strokeWidth="1"
            />
          </svg>
        </div>
        {/* ── Header panel ──────────────────────────────────────────────────── */}
        <div
          style={{
            width: 'clamp(320px, 32vw, 480px)',
            flexShrink: 0,
            position: 'relative',
            borderRight: '1px solid var(--border-rest)',
          }}
        >
          {/* Section label — top */}
          <p
            className="text-mono"
            style={{
              position: 'absolute',
              top: vTop,
              left: hPad,
              color: 'var(--text-secondary)',
            }}
          >
            04 / EXPERIENCE
          </p>

          {/* Heading — vertically centred */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              padding: `0 ${hPad}`,
              paddingBottom: `calc(${LINE} + 60px)`,
              paddingTop: '80px',
            }}
          >
            <h2
              id="experience-heading"
              className="text-section"
              style={{ color: 'var(--text-primary)' }}
            >
              Work<br />History
            </h2>
          </div>

          {/* Scroll hint */}
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

        {/* ── Experience cards ──────────────────────────────────────────────── */}
        {visible.map((exp, i) => (
          <article
            key={exp.id}
            aria-labelledby={`exp-role-${exp.id}`}
            style={{
              width: 'clamp(300px, 30vw, 440px)',
              flexShrink: 0,
              position: 'relative',
              borderRight: i < visible.length - 1 ? '1px solid var(--border-rest)' : 'none',
            }}
          >
            {/* ── Top zone: date + company ─────────────────── */}
            <div
              style={{
                position: 'absolute',
                top: vTop,
                left: cPad,
                right: cPad,
              }}
            >
              <p className="text-mono" style={{ color: 'var(--text-tertiary)', marginBottom: '10px' }}>
                {exp.dateRange}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-display), system-ui, sans-serif',
                  fontSize: 'clamp(20px, 1.8vw, 28px)',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  color: 'var(--accent)',
                  lineHeight: 1.15,
                }}
              >
                {exp.company}
              </p>
            </div>

            {/* ── Lower zone: role + description + tags ────── */}
            {/* Bounded between 42% from top and LINE+20px from bottom to avoid timeline overlap */}
            <div
              style={{
                position: 'absolute',
                top: '42%',
                bottom: `calc(${LINE} + 20px)`,
                left: cPad,
                right: cPad,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <h3
                id={`exp-role-${exp.id}`}
                className="text-project"
                style={{ color: 'var(--text-primary)', marginBottom: '12px', lineHeight: 1.22 }}
              >
                {exp.role}
              </h3>
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

            {/* ── Timeline dot — centred on the line ──────── */}
            <div
              style={{
                position: 'absolute',
                bottom: LINE,
                left: cPad,
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--accent)',
                boxShadow: '0 0 10px var(--accent)',
                transform: 'translateY(50%)',
                zIndex: 1,
              }}
            />
          </article>
        ))}

        {/* Trailing edge — wide enough to land the last card comfortably in view */}
        <div style={{ width: 'clamp(48px, 6vw, 96px)', flexShrink: 0 }} />
      </div>
    </section>
  );
}
