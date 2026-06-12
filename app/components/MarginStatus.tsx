'use client';

const baseStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 'var(--margin-safe-area)',
  pointerEvents: 'none',
  zIndex: 9000,
  fontFamily: 'var(--font-jetbrains), monospace',
  fontSize: '9px',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--text-tertiary)',
  opacity: 0.7,
  lineHeight: 1,
};

export default function MarginStatus() {
  return (
    <>
      <span aria-hidden="true" style={{ ...baseStyle, left: 'var(--margin-safe-area)' }}>
        30.7°N · 76.8°E · IST
      </span>
      <span aria-hidden="true" style={{ ...baseStyle, right: 'var(--margin-safe-area)' }}>
        SYS · NOMINAL
      </span>
    </>
  );
}
