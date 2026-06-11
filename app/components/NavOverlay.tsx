'use client';

export default function NavOverlay() {
  return (
    <>
      {/* Top-left monogram */}
      <a
        href="#hero"
        aria-label="Back to top"
        data-label="[ TOP ]"
        style={{
          position: 'fixed',
          top: '24px',
          left: 'clamp(24px, 5.5vw, 80px)',
          zIndex: 50,
          fontFamily: 'var(--font-display)',
          fontSize: '18px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          textDecoration: 'none',
          letterSpacing: '-0.01em',
        }}
      >
        VS.
      </a>

      {/* Top-right section counter — static for M1, dynamic in M3 */}
      <p
        className="text-mono"
        style={{
          position: 'fixed',
          top: '28px',
          right: 'clamp(24px, 5.5vw, 80px)',
          zIndex: 50,
          color: 'var(--text-tertiary)',
        }}
      >
        01 / 06
      </p>
    </>
  );
}
