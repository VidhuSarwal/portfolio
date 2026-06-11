export default function Contact() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="section-gap"
    >
      <div className="content-grid">
        <div className="col-span-12 lg:col-span-8">
          <p className="text-mono" style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            06 / CONTACT
          </p>

          <h2
            id="contact-heading"
            className="text-section"
            style={{ color: 'var(--text-primary)', marginBottom: '24px' }}
          >
            Let&apos;s build something.
          </h2>

          <p className="text-body" style={{ color: 'var(--text-secondary)', maxWidth: '480px', marginBottom: '48px' }}>
            Open to remote roles in systems, infrastructure, and research.
            Currently in Chandigarh, India · Available Dec&nbsp;2026.
          </p>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <li>
              <a
                href="mailto:vidhu.sarwal19@gmail.com"
                data-label="[ SEND MAIL ]"
                className="text-body"
                style={{ color: 'var(--text-primary)', textDecoration: 'none', transition: 'color 0.2s' }}
              >
                vidhu.sarwal19@gmail.com
              </a>
            </li>
            <li>
              <a
                href="https://github.com/VidhuSarwal"
                data-label="[ GITHUB ]"
                target="_blank"
                rel="noopener noreferrer"
                className="text-body"
                style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
              >
                github.com/VidhuSarwal
              </a>
            </li>
            <li>
              <a
                href="https://linkedin.com/in/vidhusarwal"
                data-label="[ LINKEDIN ]"
                target="_blank"
                rel="noopener noreferrer"
                className="text-body"
                style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
              >
                linkedin.com/in/vidhusarwal
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div
        style={{
          marginTop: 'clamp(80px, 12vh, 120px)',
          borderTop: '1px solid var(--border-rest)',
          paddingTop: '32px',
        }}
      >
        <div className="content-grid">
          <p
            className="text-mono col-span-12"
            style={{ color: 'var(--text-tertiary)' }}
          >
            © 2026 — built with restraint.
          </p>
        </div>
      </div>
    </section>
  );
}
