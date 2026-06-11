export default function Hero() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative min-h-screen flex items-center"
    >
      <div className="content-grid w-full">
        <div className="col-span-12 lg:col-span-7" style={{ paddingLeft: 'clamp(0px, 2vw, 24px)' }}>
          <p className="text-mono" style={{ color: 'var(--text-secondary)', marginBottom: '28px' }}>
            01 / SYSTEMS ENGINEER
          </p>

          <h1
            id="hero-heading"
            className="text-hero"
            style={{ color: 'var(--text-primary)', marginBottom: '16px' }}
          >
            Vidhu Sarwal.
          </h1>

          <p
            className="text-section"
            style={{ color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: '0' }}
          >
            Linux kernel · Distributed systems · AI infrastructure.
          </p>

          <span className="sep-line" />

          <p className="text-body" style={{ color: 'var(--text-secondary)', maxWidth: '480px', marginBottom: '40px' }}>
            Final-year CS undergrad. GSoC&nbsp;&apos;25 at BeagleBoard.org.
            Samsung PRISM. Linux Kernel Mentorship Program.
          </p>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <a
              href="#sbc-showcase"
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

      <p
        className="text-mono"
        style={{
          position: 'absolute',
          bottom: '32px',
          left: 'clamp(24px, 5.5vw, 80px)',
          color: 'var(--text-tertiary)',
        }}
      >
        SCROLL
      </p>
    </section>
  );
}
