'use client';

import { useEffect, useRef, useState } from 'react';

const EMAIL = 'vidhu.sarwal19@gmail.com';

const SOMETHING_VARIANTS = ['something.', 'something real.', 'something fast.', 'something lasting.', 'something strange.'];
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#@$%&?·—';

function useCyclingScramble(variants: string[]) {
  const [display, setDisplay] = useState(variants[0]);
  const idxRef  = useRef(0);
  const rafRef  = useRef(0);
  const tmrRef  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    function scrambleTo(target: string) {
      const start = performance.now();
      const DURATION = 420;
      function tick() {
        const t = Math.min(1, (performance.now() - start) / DURATION);
        const str = target.split('').map((ch, ci) => {
          if (ch === ' ' || ch === '.') return ch;
          if (t >= (ci + 1) / target.length) return ch;
          if (t >  ci / target.length) return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }).join('');
        setDisplay(str);
        if (t < 1) rafRef.current = requestAnimationFrame(tick);
        else setDisplay(target);
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    function cycle() {
      idxRef.current = (idxRef.current + 1) % variants.length;
      scrambleTo(variants[idxRef.current]);
      tmrRef.current = setTimeout(cycle, 4200);
    }

    tmrRef.current = setTimeout(cycle, 3800);
    return () => {
      clearTimeout(tmrRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, [variants]);

  return display;
}

export default function Contact() {
  const [copied, setCopied] = useState(false);
  const sectionRef  = useRef<HTMLElement>(null);
  const somethingDisplay = useCyclingScramble(SOMETHING_VARIANTS);
  const headingRef  = useRef<HTMLHeadingElement>(null);
  const bodyRef     = useRef<HTMLDivElement>(null);
  const linksRef    = useRef<HTMLUListElement>(null);

  async function copyEmail(e: React.MouseEvent) {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  }

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
      <div className="content-grid">
        <div className="col-span-12 lg:col-span-9">
          <p className="text-mono" style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            06 / CONTACT
          </p>

          {/* Giant heading — anchor the section visually */}
          <h2
            ref={headingRef}
            id="contact-heading"
            style={{
              fontFamily: 'var(--font-display), system-ui, sans-serif',
              fontSize: 'clamp(52px, 7.5vw, 120px)',
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
                fontVariantNumeric: 'tabular-nums',
                display: 'inline-block',
                minWidth: '6ch',
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
            {/* Email — click to copy */}
            <li>
              <button
                onClick={copyEmail}
                aria-label={copied ? 'Email copied!' : `Copy ${EMAIL} to clipboard`}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  color: 'var(--text-primary)',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
              >
                <span
                  className="text-body"
                  style={{ fontSize: 'clamp(16px, 1.4vw, 22px)', letterSpacing: '-0.01em' }}
                >
                  {EMAIL}
                </span>
                <span
                  className="text-mono"
                  style={{
                    color: copied ? 'var(--accent)' : 'var(--text-tertiary)',
                    transition: 'color 0.2s, opacity 0.2s',
                    opacity: copied ? 1 : 0.6,
                    fontSize: '10px',
                    letterSpacing: '0.16em',
                  }}
                >
                  {copied ? '✓ COPIED' : 'CLICK TO COPY'}
                </span>
              </button>
            </li>

            <li style={{ height: '1px', background: 'var(--border-rest)', maxWidth: '480px' }} />

            <li>
              <a
                href="https://github.com/VidhuSarwal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-body"
                style={{
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
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
                style={{
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)'; }}
              >
                <span>linkedin.com/in/vidhusarwal</span>
                <span className="text-mono" style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>↗</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 'clamp(80px, 12vh, 120px)',
          borderTop: '1px solid var(--border-rest)',
          paddingTop: '28px',
        }}
      >
        <div className="content-grid">
          <div
            className="col-span-12 text-mono"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'var(--text-tertiary)',
            }}
          >
            <span>© 2026 VIDHU SARWAL</span>
            <span>VIDHUX.DEV</span>
          </div>
        </div>
      </div>
    </section>
  );
}
