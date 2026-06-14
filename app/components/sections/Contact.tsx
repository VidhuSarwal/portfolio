'use client';

import { useEffect, useRef } from 'react';
import SignalPong from '@/app/components/SignalPong';
import { useIsMobile } from '@/app/hooks/useIsMobile';

export default function Contact() {
  const isMobile   = useIsMobile();
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const bodyRef    = useRef<HTMLDivElement>(null);
  const linksRef   = useRef<HTMLUListElement>(null);

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
      <div
        className="content-grid"
        style={{ alignItems: 'center' }}
      >
        {/* ── Left column: contact info ──────────────────────────────── */}
        <div className="col-span-12 lg:col-span-6">
          <p className="text-mono" style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            06 / CONTACT
          </p>

          <h2
            ref={headingRef}
            id="contact-heading"
            style={{
              fontFamily: 'var(--font-display), system-ui, sans-serif',
              fontSize: 'clamp(44px, 6vw, 88px)',
              fontWeight: 700,
              lineHeight: 0.95,
              letterSpacing: '-0.025em',
              color: 'var(--text-primary)',
              marginBottom: 'clamp(32px, 5vh, 56px)',
            }}
          >
            Let&apos;s build<br />
            <span style={{ color: 'var(--text-secondary)' }}>something.</span>
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

        {/* ── Right column: SignalPong ───────────────────────────────── */}
        <div
          className="col-span-12 lg:col-span-6"
          style={{ height: isMobile ? 'clamp(260px, 70vw, 340px)' : 'clamp(340px, 48vh, 520px)' }}
        >
          <SignalPong />
        </div>
      </div>
    </section>
  );
}
