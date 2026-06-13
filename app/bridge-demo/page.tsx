import BridgeOscilloscope from '@/app/components/sections/BridgeOscilloscope';

export default function BridgeDemoPage() {
  return (
    <main style={{ background: 'var(--bg-base)' }}>
      {/* Spacer so the section doesn't sit at the absolute top */}
      <div style={{ height: '20vh', display: 'flex', alignItems: 'center', paddingInline: 'clamp(32px, 4vw, 64px)' }}>
        <p style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: '11px', letterSpacing: '0.14em', color: 'var(--text-tertiary)' }}>
          BRIDGE DEMO — scroll down ↓
        </p>
      </div>

      <BridgeOscilloscope />

      {/* Content after so you can scroll past */}
      <div
        style={{
          height: '50vh',
          display: 'flex',
          alignItems: 'center',
          paddingInline: 'clamp(32px, 4vw, 64px)',
          borderTop: '1px solid var(--border-rest)',
        }}
      >
        <p style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: '11px', letterSpacing: '0.14em', color: 'var(--text-tertiary)' }}>
          SECTION COMPLETE
        </p>
      </div>
    </main>
  );
}
