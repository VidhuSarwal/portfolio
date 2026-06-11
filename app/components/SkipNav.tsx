'use client';

export default function SkipNav() {
  return (
    <a
      href="#hero"
      className="text-mono"
      style={{
        position: 'fixed',
        top: '-100px',
        left: 0,
        zIndex: 100,
        background: 'var(--bg-elevated)',
        color: 'var(--text-primary)',
        padding: '8px 16px',
        transition: 'top 0.1s',
      }}
      onFocus={(e) => { (e.currentTarget as HTMLElement).style.top = '0'; }}
      onBlur={(e) => { (e.currentTarget as HTMLElement).style.top = '-100px'; }}
    >
      Skip to content
    </a>
  );
}
