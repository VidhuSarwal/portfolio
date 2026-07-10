'use client';

import Link from 'next/link';

export default function KernelNav() {
  return (
    <nav
      aria-label="Page navigation"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, pointerEvents: 'none' }}
    >
      <Link
        href="/"
        aria-label="Back to home"
        style={{
          position: 'absolute',
          top: 'var(--margin-safe-area)',
          left: 'var(--margin-safe-area)',
          fontFamily: 'var(--font-display)',
          fontSize: '18px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          textDecoration: 'none',
          letterSpacing: '-0.01em',
          pointerEvents: 'auto',
        }}
      >
        VX.
      </Link>

      <Link
        href="/"
        className="text-mono"
        style={{
          position: 'absolute',
          top: 'var(--margin-safe-area)',
          right: 'var(--margin-safe-area)',
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          letterSpacing: '0.12em',
          pointerEvents: 'auto',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)';
        }}
      >
        ← BACK
      </Link>
    </nav>
  );
}
