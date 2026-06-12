'use client';

import { useEffect, useRef } from 'react';

const WORDS = ['EMBEDDED', 'SYSTEMS', '×', 'AI', 'SCALE'];

export default function Transition() {
  const containerRef = useRef<HTMLElement>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const lineRef = useRef<SVGLineElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    async function init() {
      const gsapMod = await import('gsap');
      const stMod = await import('gsap/ScrollTrigger');
      const gsap = gsapMod.gsap;
      gsap.registerPlugin(stMod.ScrollTrigger);

      const section = containerRef.current;
      if (!section) return;

      const words = wordsRef.current.filter(Boolean) as HTMLSpanElement[];

      if (reduced) {
        words.forEach(w => { w.style.opacity = '1'; w.style.transform = 'none'; });
        return;
      }

      // Each word reveals on scroll-scrub: clips up from below
      gsap.fromTo(
        words,
        { y: '110%', opacity: 0 },
        {
          y: '0%',
          opacity: 1,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            end: 'top 20%',
            scrub: 0.8,
          },
        }
      );

      // Separator line draws left-to-right
      if (lineRef.current) {
        gsap.fromTo(
          lineRef.current,
          { strokeDashoffset: 1440 },
          {
            strokeDashoffset: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top 60%',
              end: 'top 10%',
              scrub: 1,
            },
          }
        );
      }
    }

    init();
  }, []);

  return (
    <section
      id="transition"
      ref={containerRef}
      aria-label="02 — Bridge"
      style={{
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid var(--border-rest)',
      }}
    >
      {/* Top label */}
      <div
        className="content-grid w-full"
        style={{ position: 'absolute', top: '40px', left: 0, right: 0 }}
      >
        <p className="text-mono col-span-12" style={{ color: 'var(--text-tertiary)' }}>
          02 / BRIDGE
        </p>
      </div>

      {/* Statement */}
      <div className="content-grid w-full">
        <div
          className="col-span-12"
          aria-label="Embedded systems meets AI scale"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'clamp(8px, 1.2vw, 20px)',
            alignItems: 'baseline',
          }}
        >
          {WORDS.map((word, i) => (
            <div
              key={word + i}
              style={{ overflow: 'hidden', display: 'inline-block' }}
            >
              <span
                ref={(el) => { wordsRef.current[i] = el; }}
                style={{
                  display: 'inline-block',
                  fontFamily: 'var(--font-display), system-ui, sans-serif',
                  fontSize: word === '×' ? 'clamp(40px, 5.5vw, 80px)' : 'clamp(52px, 7vw, 108px)',
                  fontWeight: 700,
                  lineHeight: 0.95,
                  letterSpacing: '-0.02em',
                  color: word === '×' ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  opacity: 0,
                  transform: 'translateY(110%)',
                }}
              >
                {word}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Horizontal rule — draws on scroll */}
      <div
        className="content-grid w-full"
        style={{ position: 'absolute', bottom: '60px', left: 0, right: 0 }}
      >
        <div className="col-span-12" style={{ position: 'relative', height: '1px' }}>
          <svg
            style={{ position: 'absolute', inset: 0, width: '100%', height: '1px', overflow: 'visible' }}
            preserveAspectRatio="none"
          >
            <line
              ref={lineRef}
              x1="0" y1="0" x2="100%" y2="0"
              stroke="var(--border-active)"
              strokeWidth="1"
              strokeDasharray="1440"
              strokeDashoffset="1440"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
