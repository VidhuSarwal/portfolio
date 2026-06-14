'use client';

import { useEffect, useRef, useState } from 'react';
import GridWall from '@/app/components/GridWall';
import CipherLock from '@/app/components/CipherLock';
import { useLoader } from '@/app/providers/LoaderContext';

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%&?';
const SCRAMBLE_DIGITS = '0123456789';

// All delays are relative to when isDone fires (loader complete), not page mount
const CRED_START = 2500;
const CRED_STAGGER = 380;
const CTA_START = CRED_START + 2 * CRED_STAGGER + 620; // ≈ 3880ms after loader

const CREDENTIALS = [
  { index: '01', label: 'LINUX KERNEL MENTORSHIP PROGRAM · LFX', year: "'26" },
  { index: '02', label: 'GOOGLE SUMMER OF CODE · BEAGLEBOARD.ORG', year: "'25" },
  { index: '03', label: 'SAMSUNG R&D · PRISM RESEARCH INTERN', year: "'25" },
];

function useScramble(target: string, startDelay: number, charSet = SCRAMBLE_CHARS) {
  const [display, setDisplay] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { setDisplay(target); return; }

    const t = setTimeout(() => {
      const PHASE1_END = 200;
      const LOCK_AT = 480;
      const start = Date.now();
      function tick() {
        const elapsed = Date.now() - start;
        if (elapsed >= LOCK_AT) {
          setDisplay(target);
          setFlash(true);
          setTimeout(() => setFlash(false), 200);
          return;
        }
        const intensity = elapsed < PHASE1_END
          ? 1.0
          : 1.0 - ((elapsed - PHASE1_END) / (LOCK_AT - PHASE1_END)) * 0.92;
        setDisplay(
          target.split('').map((ch) =>
            ch === ' ' || ch === '·' || ch === "'"
              ? ch
              : Math.random() < intensity
                ? charSet[Math.floor(Math.random() * charSet.length)]
                : ch
          ).join('')
        );
        setTimeout(tick, 55);
      }
      tick();
    }, startDelay);

    return () => clearTimeout(t);
  }, [target, startDelay, charSet]);

  return { display, flash };
}

function ScrambleSpan({
  target,
  startDelay,
  charSet = SCRAMBLE_CHARS,
  style,
}: {
  target: string;
  startDelay: number;
  charSet?: string;
  style?: React.CSSProperties;
}) {
  const { display, flash } = useScramble(target, startDelay, charSet);
  return (
    <span
      style={{
        display: 'inline-block',
        fontVariantNumeric: 'tabular-nums',
        color: flash ? 'var(--accent)' : 'inherit',
        transition: flash ? 'none' : 'color 0.3s ease, opacity 0.1s ease',
        opacity: display === null ? 0 : 1,
        ...style,
      }}
    >
      {display ?? target}
    </span>
  );
}

function ViewWorkCTA() {
  const arrowCanvasRef = useRef<HTMLCanvasElement>(null);
  const animRef        = useRef(0);

  function runTrace() {
    const canvas = arrowCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    cancelAnimationFrame(animRef.current);
    const W = canvas.width, H = canvas.height;
    const start = performance.now();
    const DURATION = 380;
    function frame(ts: number) {
      const t    = Math.min(1, (ts - start) / DURATION);
      const ease = 1 - Math.pow(1 - t, 3);
      ctx!.clearRect(0, 0, W, H);
      const headX = ease * W;
      const tailX = Math.max(0, headX - W * 0.55);
      const y     = H / 2;
      const grad  = ctx!.createLinearGradient(tailX, 0, headX, 0);
      grad.addColorStop(0, 'rgba(200,228,255,0)');
      grad.addColorStop(1, 'rgba(200,228,255,0.85)');
      ctx!.beginPath();
      ctx!.moveTo(tailX, y);
      ctx!.lineTo(headX, y);
      ctx!.strokeStyle = grad;
      ctx!.lineWidth = 1.5;
      ctx!.stroke();
      if (t < 1) animRef.current = requestAnimationFrame(frame);
    }
    animRef.current = requestAnimationFrame(frame);
  }

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  return (
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
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        overflow: 'visible',
      }}
      onMouseEnter={runTrace}
    >
      <span>VIEW WORK</span>
      <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        →
        <canvas
          ref={arrowCanvasRef}
          width={52}
          height={14}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        />
      </span>
    </a>
  );
}

function UnmaskReveal({
  children,
  startDelay,
  style,
}: {
  children: React.ReactNode;
  startDelay: number;
  style?: React.CSSProperties;
}) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { setActive(true); return; }
    const t = setTimeout(() => setActive(true), startDelay);
    return () => clearTimeout(t);
  }, [startDelay]);

  return (
    <span style={{ position: 'relative', display: 'inline-flex', ...style }}>
      {children}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '-1px',
          background: 'repeating-linear-gradient(-45deg, var(--text-primary) 0px, var(--text-primary) 1px, var(--text-tertiary) 1px, var(--text-tertiary) 4px)',
          clipPath: active ? 'inset(0 0 0 101%)' : 'inset(0 0 0 0%)',
          transition: active ? 'clip-path 0.52s cubic-bezier(0.77,0,0.175,1)' : 'none',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
    </span>
  );
}

export default function Hero() {
  const { isDone } = useLoader();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [hintVisible, setHintVisible] = useState(true);

  // Fire GSAP only after loader completes
  useEffect(() => {
    if (!isDone) return;

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
        const tl = gsap.timeline();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const split = new (splitMod.SplitText as any)(headingRef.current, { type: 'chars' });
        // Parent h1 must be visible; chars start at opacity:0 via fromTo below
        if (headingRef.current) headingRef.current.style.opacity = '1';
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
        const tl = gsap.timeline();
        if (headingRef.current) tl.fromTo(headingRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' });
        if (contentRef.current) tl.fromTo(contentRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.3');
      }
    }
    init();
  }, [isDone]);

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
        alignItems: 'flex-start',
        paddingTop: 'clamp(18vh, 22vh, 26vh)',
        overflow: 'hidden',
      }}
    >
      <GridWall />

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 55% 80% at 28% 50%, var(--hero-overlay-near) 0%, var(--hero-overlay-mid) 55%, transparent 100%)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <div className="content-grid w-full" style={{ position: 'relative', zIndex: 1 }}>
        <div className="col-span-12 lg:col-span-8">

          <p className="text-mono" style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            01 / SYSTEMS ENGINEER
          </p>

          {/* opacity: 0 — GSAP will animate this in once isDone fires */}
          <h1
            ref={headingRef}
            id="hero-heading"
            className="text-hero"
            style={{ color: 'var(--text-primary)', marginBottom: '20px', opacity: 0 }}
          >
            Vidhu Sarwal.
          </h1>

          {/* Mounts when loader completes; all child timers start from that moment */}
          <div ref={contentRef} style={{ opacity: 0 }}>
            {isDone && (
              <>
                <CipherLock delay={700} />

                <ul
                  aria-label="Credentials"
                  style={{ listStyle: 'none', marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '6px' }}
                >
                  {CREDENTIALS.map((c, i) => {
                    const delay = CRED_START + i * CRED_STAGGER;
                    return (
                      <li
                        key={c.index}
                        className="text-mono"
                        style={{ display: 'flex', alignItems: 'baseline', gap: '8px', color: 'var(--text-secondary)' }}
                      >
                        <ScrambleSpan target={c.index} startDelay={delay} charSet={SCRAMBLE_DIGITS} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                        <ScrambleSpan target={c.label} startDelay={delay} />
                        <ScrambleSpan target={c.year} startDelay={delay} style={{ flexShrink: 0 }} />
                      </li>
                    );
                  })}
                </ul>

                <span className="sep-line" style={{ marginTop: '32px', marginBottom: '32px' }} />

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <UnmaskReveal startDelay={CTA_START}>
                    <ViewWorkCTA />
                  </UnmaskReveal>

                  <UnmaskReveal startDelay={CTA_START + 120}>
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
                  </UnmaskReveal>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

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
