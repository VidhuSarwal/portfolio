'use client';

import { useEffect, useRef, useState } from 'react';
import GridWall from '@/app/components/GridWall';
import CipherLock from '@/app/components/CipherLock';

// TODO: confirm whether LFX'26 is a separate upcoming mentorship or alias for LKMP
const CREDENTIALS = [
  { index: '01', label: 'LFX MENTORSHIP', year: "'26" },
  { index: '02', label: 'GOOGLE SUMMER OF CODE · BEAGLEBOARD.ORG', year: "'25" },
  { index: '03', label: 'SAMSUNG R&D · RESEARCH INTERN', year: "'25" },
];

export default function Hero() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [hintVisible, setHintVisible] = useState(true);

  useEffect(() => {
    async function init() {
      const gsapMod = await import('gsap');
      const gsap = gsapMod.gsap;

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reducedMotion) {
        if (headingRef.current) headingRef.current.style.opacity = '1';
        if (contentRef.current) contentRef.current.style.opacity = '1';
        return;
      }

      try {
        const splitMod = await import('gsap/SplitText');
        gsap.registerPlugin(splitMod.SplitText);
        const tl = gsap.timeline({ delay: 0.1 });
        // @ts-expect-error dynamic import
        const split = new splitMod.SplitText(headingRef.current, { type: 'chars' });
        tl.fromTo(split.chars,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.04, ease: 'power3.out' }
        );
        if (contentRef.current) {
          tl.fromTo(contentRef.current,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
            '-=0.3'
          );
        }
      } catch {
        const tl = gsap.timeline({ delay: 0.1 });
        if (headingRef.current) tl.fromTo(headingRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' });
        if (contentRef.current) tl.fromTo(contentRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.3');
      }
    }
    init();
  }, []);

  useEffect(() => {
    function onScroll() {
      if (window.scrollY > 40) { setHintVisible(false); window.removeEventListener('scroll', onScroll); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        // ~42% from top — editorial sweet spot, slightly above dead-center
        alignItems: 'flex-start',
        paddingTop: 'clamp(14vh, 18vh, 22vh)',
        overflow: 'hidden',
      }}
    >
      <GridWall />

      {/* Content shadow — dims grid behind text, keeps it alive at edges */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 55% 80% at 28% 50%, rgba(8,8,8,0.82) 0%, rgba(8,8,8,0.45) 55%, transparent 100%)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <div className="content-grid w-full" style={{ position: 'relative', zIndex: 1 }}>
        <div className="col-span-12 lg:col-span-8">

          {/* Section label */}
          <p className="text-mono" style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            01 / SYSTEMS ENGINEER
          </p>

          {/* Name */}
          <h1
            ref={headingRef}
            id="hero-heading"
            className="text-hero"
            style={{ color: 'var(--text-primary)', marginBottom: '20px' }}
          >
            Vidhu Sarwal.
          </h1>

          {/* Cipher lock subtitle + credentials + CTAs */}
          <div ref={contentRef}>
            <CipherLock delay={700} />

            {/* Credential list */}
            <ul
              aria-label="Credentials"
              style={{
                listStyle: 'none',
                marginTop: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {CREDENTIALS.map((c) => (
                <li
                  key={c.index}
                  className="text-mono"
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '12px',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  <span style={{ color: 'var(--text-tertiary)', opacity: 0.5, flexShrink: 0 }}>
                    {c.index}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{c.label}</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                    {c.year}
                  </span>
                </li>
              ))}
            </ul>

            {/* Separator */}
            <span className="sep-line" style={{ marginTop: '32px', marginBottom: '32px' }} />

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <a
                href="#sbc-showcase"
                data-label="[ VIEW WORK ]"
                className="text-mono"
                style={{
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-active)',
                  padding: '12px 24px',
                  textDecoration: 'none',
                  letterSpacing: '0.12em',
                  transition: 'border-color 0.2s, color 0.2s',
                }}
              >
                VIEW WORK →
              </a>
              <a
                href="#contact"
                data-label="[ CONTACT ]"
                className="text-mono"
                style={{
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  letterSpacing: '0.12em',
                  transition: 'color 0.2s',
                }}
              >
                GET IN TOUCH
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <p
        className="text-mono"
        style={{
          position: 'absolute',
          bottom: '32px',
          left: 'clamp(24px, 5.5vw, 80px)',
          color: 'var(--text-tertiary)',
          zIndex: 1,
          opacity: hintVisible ? 1 : 0,
          transition: 'opacity 0.6s ease',
          pointerEvents: 'none',
        }}
      >
        SCROLL
      </p>
    </section>
  );
}
