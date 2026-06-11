'use client';

import { useEffect, useRef, useState } from 'react';
import GridWall from '@/app/components/GridWall';
import CipherLock from '@/app/components/CipherLock';

export default function Hero() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLParagraphElement>(null);
  const [hintVisible, setHintVisible] = useState(true);

  useEffect(() => {
    let gsap: typeof import('gsap').gsap;
    let SplitText: unknown;

    async function init() {
      const gsapMod = await import('gsap');
      gsap = gsapMod.gsap;

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reducedMotion) {
        // Just show everything immediately
        if (headingRef.current) headingRef.current.style.opacity = '1';
        if (contentRef.current) contentRef.current.style.opacity = '1';
        return;
      }

      try {
        const splitMod = await import('gsap/SplitText');
        SplitText = splitMod.SplitText;
        gsap.registerPlugin(splitMod.SplitText);
      } catch {
        // SplitText not available — fallback to simple fade
        SplitText = null;
      }

      const tl = gsap.timeline({ delay: 0.1 });

      if (SplitText && headingRef.current) {
        // @ts-expect-error dynamic import
        const split = new SplitText(headingRef.current, { type: 'chars' });
        tl.fromTo(
          split.chars,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.04,
            ease: 'power3.out',
          }
        );
      } else if (headingRef.current) {
        tl.fromTo(
          headingRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }
        );
      }

      if (contentRef.current) {
        tl.fromTo(
          contentRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
          '-=0.3'
        );
      }
    }

    init();
  }, []);

  useEffect(() => {
    function onScroll() {
      if (window.scrollY > 40) {
        setHintVisible(false);
        window.removeEventListener('scroll', onScroll);
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}
      onMouseMove={(e) => {
        const canvas = e.currentTarget.querySelector('canvas');
        if (canvas) {
          canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: e.clientX, clientY: e.clientY, bubbles: false }));
        }
      }}
    >
      <GridWall />

      {/* Content shadow — dims the grid behind the text, keeps it alive at the edges */}
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
        <div className="col-span-12 lg:col-span-7">
          <p className="text-mono" style={{ color: 'var(--text-secondary)', marginBottom: '28px' }}>
            01 / SYSTEMS ENGINEER
          </p>

          <h1
            ref={headingRef}
            id="hero-heading"
            className="text-hero"
            style={{ color: 'var(--text-primary)', marginBottom: '16px' }}
          >
            Vidhu Sarwal.
          </h1>

          <div ref={contentRef}>
            <CipherLock delay={700} />

            <span className="sep-line" />

            <p
              className="text-body"
              style={{ color: 'var(--text-secondary)', maxWidth: '480px', marginBottom: '40px' }}
            >
              Final-year CS undergrad. GSoC&nbsp;&apos;25 at BeagleBoard.org.
              Samsung PRISM. Linux Kernel Mentorship Program.
            </p>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
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
        ref={scrollHintRef}
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
