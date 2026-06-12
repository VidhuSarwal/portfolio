'use client';

import { useEffect, useRef } from 'react';
import { siteConfig } from '@/lib/config';
import { projects } from '@/lib/projects';

export default function Projects() {
  const sectionRef = useRef<HTMLElement>(null);
  const rowRefs = useRef<(HTMLElement | null)[]>([]);
  const visible = projects.filter(
    (p) => p.configKey === null || siteConfig[p.configKey]
  );

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    async function init() {
      const gsapMod = await import('gsap');
      const stMod   = await import('gsap/ScrollTrigger');
      const gsap    = gsapMod.gsap;
      gsap.registerPlugin(stMod.ScrollTrigger);

      rowRefs.current.forEach((row) => {
        if (!row) return;
        const num   = row.querySelector<HTMLElement>('[data-role="index"]');
        const title = row.querySelector<HTMLElement>('[data-role="title"]');
        const meta  = row.querySelectorAll<HTMLElement>('[data-role="meta"]');

        gsap.set([num, title, ...Array.from(meta)], { opacity: 0, y: 18 });

        gsap.to([num, title, ...Array.from(meta)], {
          opacity: 1,
          y: 0,
          stagger: 0.06,
          duration: 0.55,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: row,
            start: 'top 82%',
            toggleActions: 'play none none reverse',
          },
        });
      });
    }

    init();
  }, [visible.length]);

  return (
    <section
      id="sbc-showcase"
      ref={sectionRef}
      aria-labelledby="projects-heading"
      style={{ paddingBlock: 'clamp(120px, 16vh, 200px)' }}
    >
      <div className="content-grid">
        {/* Header */}
        <div className="col-span-12" style={{ marginBottom: '64px' }}>
          <p className="text-mono" style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            03 / PROJECTS
          </p>
          <h2 id="projects-heading" className="text-section" style={{ color: 'var(--text-primary)' }}>
            Selected Work
          </h2>
        </div>

        {/* Table header */}
        <div
          className="col-span-12 text-mono"
          style={{
            display: 'grid',
            gridTemplateColumns: '3rem 1fr auto auto',
            gap: '0 24px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--border-rest)',
            color: 'var(--text-tertiary)',
            letterSpacing: '0.14em',
          }}
        >
          <span>#</span>
          <span>PROJECT</span>
          <span style={{ textAlign: 'right' }}>DOMAIN</span>
          <span style={{ textAlign: 'right' }}>YEAR</span>
        </div>

        {/* Project rows */}
        <div className="col-span-12">
          {visible.map((project, i) => (
            <ProjectRow
              key={project.id}
              project={project}
              index={i}
              ref={(el) => { rowRefs.current[i] = el; }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

import { forwardRef } from 'react';
import type { Project } from '@/lib/projects';

const ProjectRow = forwardRef<HTMLElement, { project: Project; index: number }>(
  function ProjectRow({ project }, ref) {
    const hoverRef = useRef<HTMLElement>(null);

    function setRef(el: HTMLElement | null) {
      (hoverRef as React.MutableRefObject<HTMLElement | null>).current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = el;
    }

    return (
      <article
        ref={setRef}
        style={{
          borderBottom: '1px solid var(--border-rest)',
          padding: 'clamp(24px, 3.5vh, 40px) 0',
          cursor: 'default',
          transition: 'background 0.2s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'transparent';
        }}
      >
        {/* Top row: index · title · category · year */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '3rem 1fr auto auto',
            gap: '0 24px',
            alignItems: 'baseline',
            marginBottom: '16px',
          }}
        >
          <span
            data-role="index"
            className="text-mono"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {project.index}
          </span>

          <h3
            data-role="title"
            className="text-project"
            style={{ color: 'var(--text-primary)' }}
          >
            {project.title}
          </h3>

          <span
            data-role="meta"
            className="text-mono"
            style={{ color: 'var(--text-secondary)', textAlign: 'right' }}
          >
            {project.category.split('·')[0].trim()}
          </span>

          <span
            data-role="meta"
            className="text-mono"
            style={{ color: 'var(--text-tertiary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
          >
            {project.year}
          </span>
        </div>

        {/* Description + tags */}
        <div
          style={{
            paddingLeft: 'calc(3rem + 24px)',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '16px',
            alignItems: 'flex-end',
          }}
        >
          <p
            data-role="meta"
            className="text-body"
            style={{ color: 'var(--text-secondary)', maxWidth: '640px' }}
          >
            {project.description}
          </p>

          <div data-role="meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'flex-end', maxWidth: '260px' }}>
            {project.tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        </div>

        {/* Links row — only rendered when at least one href exists */}
        {(project.caseStudyHref || project.liveHref) && (
          <div
            data-role="meta"
            style={{
              paddingLeft: 'calc(3rem + 24px)',
              marginTop: '14px',
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
            }}
          >
            {project.caseStudyHref && (
              <a
                href={project.caseStudyHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-mono"
                style={{
                  color: 'var(--text-tertiary)',
                  textDecoration: 'none',
                  fontSize: '10px',
                  letterSpacing: '0.14em',
                  borderBottom: '1px solid var(--border-rest)',
                  paddingBottom: '2px',
                  transition: 'color 0.18s ease, border-color 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--accent)';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-tertiary)';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border-rest)';
                }}
              >
                FINAL REPORT ↗
              </a>
            )}
            {project.liveHref && (
              <a
                href={project.liveHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-mono"
                style={{
                  color: 'var(--text-tertiary)',
                  textDecoration: 'none',
                  fontSize: '10px',
                  letterSpacing: '0.14em',
                  borderBottom: '1px solid var(--border-rest)',
                  paddingBottom: '2px',
                  transition: 'color 0.18s ease, border-color 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--accent)';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-tertiary)';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border-rest)';
                }}
              >
                LIVE ↗
              </a>
            )}
          </div>
        )}
      </article>
    );
  }
);
