import { siteConfig } from '@/lib/config';
import { projects } from '@/lib/projects';

export default function SBCShowcase() {
  const visibleProjects = projects.filter(
    (p) => p.configKey === null || siteConfig[p.configKey]
  );

  return (
    <section
      id="sbc-showcase"
      aria-labelledby="sbc-heading"
      className="section-gap"
    >
      <div className="content-grid">
        <div className="col-span-12">
          <p className="text-mono" style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            03 / PROJECTS
          </p>
        </div>

        {/* SBC placeholder — will be replaced with R3F canvas in M4 */}
        <div
          className="col-span-12 lg:col-span-6"
          style={{
            aspectRatio: '4/3',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-rest)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p className="text-mono" style={{ color: 'var(--text-tertiary)' }}>
            SBC MODEL — MILESTONE 4
          </p>
        </div>

        {/* Project cards */}
        <div className="col-span-12 lg:col-span-6" style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          {visibleProjects.map((project) => (
            <article key={project.id}>
              <p className="text-mono" style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>
                {project.index} / PROJECT
              </p>
              <p className="text-mono" style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }}>
                {project.category}
              </p>
              <h3 className="text-project" style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>
                {project.title}
              </h3>
              <p className="text-body" style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                {project.description}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                {project.tags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
                {project.caseStudyHref && (
                  <a
                    href={project.caseStudyHref}
                    className="text-mono"
                    style={{ marginLeft: 'auto', color: 'var(--accent)', textDecoration: 'none' }}
                  >
                    ↗ CASE STUDY
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
