'use client';

import { useEffect, useRef, useState } from 'react'; // useState used by useCyclingScramble
import SignalPong from '@/app/components/SignalPong';

const SOMETHING_VARIANTS = ['something.', 'something real.', 'something fast.', 'something lasting.', 'something strange.'];
const MAX_LEN = Math.max(...SOMETHING_VARIANTS.map(v => v.length));
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#@$%&?';

function useCyclingScramble(variants: string[]) {
  const [display, setDisplay] = useState(variants[0]);
  const idxRef = useRef(0);
  const rafRef = useRef(0);
  const tmrRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    function scrambleTo(target: string) {
      cancelAnimationFrame(rafRef.current);
      const start    = performance.now();
      const DURATION = 900; // slower, smoother reveal
      function tick() {
        const t = Math.min(1, (performance.now() - start) / DURATION);
        // Resolve left-to-right; unresolved chars show placeholder '·'
        const str = Array.from({ length: MAX_LEN }, (_, ci) => {
          const tch = target[ci] ?? '';
          if (!tch) return ' '; // nbsp keeps width stable
          if (tch === ' ' || tch === '.') return tch;
          const resolveAt = (ci + 1) / target.length;
          const scrambleAt = ci / target.length;
          if (t >= resolveAt)   return tch;
          if (t >= scrambleAt)  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          return '·';
        }).join('');
        setDisplay(str);
        if (t < 1) rafRef.current = requestAnimationFrame(tick);
        else setDisplay(target.padEnd(MAX_LEN, ' '));
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    // Initialise display padded to max width so element never shrinks
    setDisplay(variants[0].padEnd(MAX_LEN, ' '));

    function cycle() {
      idxRef.current = (idxRef.current + 1) % variants.length;
      scrambleTo(variants[idxRef.current]);
      tmrRef.current = setTimeout(cycle, 7000);
    }

    tmrRef.current = setTimeout(cycle, 6000);
    return () => {
      clearTimeout(tmrRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, [variants]);

  return display;
}

export default function Contact() {
  const sectionRef  = useRef<HTMLElement>(null);
  const somethingDisplay = useCyclingScramble(SOMETHING_VARIANTS);
  const headingRef  = useRef<HTMLHeadingElement>(null);
  const bodyRef     = useRef<HTMLDivElement>(null);
  const linksRef    = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    async function init() {
      const gsapMod = await import('gsap');
      const stMod   = await import('gsap/ScrollTrigger');
      const gsap    = gsapMod.gsap;
      gsap.registerPlugin(stMod.ScrollTrigger);

      const section = sectionRef.current;
      if (!section) return;

      const heading = headingRef.current;
      const body    = bodyRef.current;
      const links   = linksRef.current;

      [heading, body, links].forEach((el, i) => {
        if (!el) return;
        gsap.fromTo(
          el,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            delay: i * 0.1,
            ease: 'power3.out',
            scrollTrigger: { trigger: section, start: 'top 72%' },
          }
        );
      });
    }

    init();
  }, []);

  return (
    <section
      id="contact"
      ref={sectionRef}
      aria-labelledby="contact-heading"
      style={{
        paddingBlock: 'clamp(120px, 16vh, 200px)',
        borderTop: '1px solid var(--border-rest)',
      }}
    >
      {/* Outer wrapper: flex row on desktop, stack on mobile */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: 0,
        paddingInline: 'clamp(24px, 5.5vw, 80px)',
      }}>
        {/* ── Left: text content ── 50% equal column */}
        <div style={{ flex: '1 1 0', minWidth: 0, paddingRight: 'clamp(24px, 3vw, 48px)' }}>
          <p className="text-mono" style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            06 / CONTACT
          </p>

          <h2
            ref={headingRef}
            id="contact-heading"
            style={{
              fontFamily: 'var(--font-display), system-ui, sans-serif',
              fontSize: 'clamp(36px, 5vw, 80px)',
              fontWeight: 700,
              lineHeight: 0.95,
              letterSpacing: '-0.025em',
              color: 'var(--text-primary)',
              marginBottom: 'clamp(32px, 5vh, 56px)',
            }}
          >
            Let&apos;s build<br />
            <span
              style={{
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-jetbrains), monospace',
                display: 'inline-block',
                whiteSpace: 'pre',
                letterSpacing: '-0.02em',
              }}
            >{somethingDisplay}</span>
          </h2>

          <div ref={bodyRef}>
            <p
              className="text-body"
              style={{
                color: 'var(--text-secondary)',
                maxWidth: '480px',
                marginBottom: '48px',
                lineHeight: 1.65,
              }}
            >
              Open to remote roles in systems, infrastructure, and research.
              Currently in Chandigarh, India&nbsp;·&nbsp;Available Dec&nbsp;2026.
            </p>
          </div>

          <ul
            ref={linksRef}
            style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            <li>
              <a
                href="https://github.com/VidhuSarwal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-body"
                style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '10px' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)'; }}
              >
                <span>github.com/VidhuSarwal</span>
                <span className="text-mono" style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>↗</span>
              </a>
            </li>

            <li>
              <a
                href="https://linkedin.com/in/vidhusarwal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-body"
                style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '10px' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)'; }}
              >
                <span>linkedin.com/in/vidhusarwal</span>
                <span className="text-mono" style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>↗</span>
              </a>
            </li>
          </ul>
        </div>{/* end left text column */}

        {/* ── Right: SignalPong — desktop only ── */}
        <div
          aria-hidden="true"
          className="signal-pong-desktop"
          style={{
            flex: '1 1 0',
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingLeft: 'clamp(32px, 4vw, 64px)',
          }}
        >
          <div style={{ width: '100%', aspectRatio: '4 / 3' }}>
            <SignalPong />
          </div>
        </div>
      </div>{/* end flex row */}
    </section>
  );
}
