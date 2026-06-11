import { siteConfig } from '@/lib/config';
import { experiences } from '@/lib/experience';

export default function Experience() {
  const visible = experiences.filter(
    (e) => e.configKey === null || siteConfig[e.configKey]
  );

  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      className="section-gap"
    >
      <div className="content-grid">
        <div className="col-span-12" style={{ marginBottom: '64px' }}>
          <p className="text-mono" style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            04 / EXPERIENCE
          </p>
          <h2 id="experience-heading" className="text-section" style={{ color: 'var(--text-primary)' }}>
            Work History
          </h2>
        </div>

        {/* Timeline line placeholder */}
        <div className="col-span-12" style={{ marginBottom: '48px' }}>
          <div style={{ height: '1px', background: 'var(--border-rest)', position: 'relative' }}>
            {visible.map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: '-3px',
                  left: `${(i / (visible.length - 1 || 1)) * 100}%`,
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: 'var(--text-tertiary)',
                  transform: 'translateX(-50%)',
                }}
              />
            ))}
          </div>
        </div>

        {visible.map((exp) => (
          <article
            key={exp.id}
            className="col-span-12 md:col-span-6 lg:col-span-4"
            style={{
              borderTop: '1px solid var(--border-rest)',
              paddingTop: '32px',
            }}
          >
            <p className="text-mono" style={{ color: 'var(--text-tertiary)', marginBottom: '8px' }}>
              {exp.dateRange}
            </p>
            <p
              className="text-mono"
              style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '12px' }}
            >
              {exp.company}
            </p>
            <h3 className="text-project" style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: 'clamp(18px, 2vw, 24px)' }}>
              {exp.role}
            </h3>
            <p className="text-body" style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              {exp.description}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {exp.tags.map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
