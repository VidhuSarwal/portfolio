'use client';

import KineticBasket from '@/app/components/KineticBasket';

const SECTIONS = [
  { label: 'HELIX PROJECTION', body: 'Four tapered helices in 3D space. Each strand phases 90° apart. Projected through a perspective matrix and rendered as SVG polylines. Depth-sorted every frame so nearer strands render over far strands — the weave crossing pattern changes as the basket rotates.' },
  { label: 'TAPERING', body: 'The helix radius follows R(t) = R_max · √sin(πt). This causes all four strands to converge at the top and bottom junctions, matching the forged cap detail of a real basket twist baluster.' },
  { label: 'INFLATION', body: 'Scroll velocity drives the helix radius through a spring system. At rest: radius is zero — the basket collapses to the rail axis. As momentum builds, R_max expands to 14.5px — the cage opens. Stops scrolling: critically-damped spring contracts it back to nothing.' },
  { label: 'ROTATION', body: 'The ornament rotates continuously around Y at 8°/s idle. Under scroll: up to 160°/s. Because strands are DOM-reordered by depth each frame, the crossing pattern visually changes — you see different faces, different overlaps, a genuine 3D object.' },
  { label: 'POSITION', body: 'Basket Y-position is spring-chased to scroll progress with stiffness 0.09 and damping 0.80. Weighted, slightly lagging — a bead on a rail with mass.' },
  { label: 'TAILS', body: 'Short decorative pins extend from each cap — top and bottom — matching the terminal detail of a real baluster basket. They connect visually to the rail and give the ornament a complete, mounted appearance.' },
];

export default function BasketDemoClient() {
  return (
    <>
      <KineticBasket
        marginTop={80}
        marginBot={80}
        offsetX="clamp(16px, 3vw, 48px)"
      />

      <div style={{
        minHeight: '600vh',
        fontFamily: 'var(--font-display), system-ui, sans-serif',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
      }}>
        {/* Header */}
        <div style={{
          position: 'sticky',
          top: 0,
          padding: '24px clamp(80px, 10vw, 160px)',
          borderBottom: '1px solid var(--border-rest)',
          background: 'var(--bg-base)',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
            BASKET DEMO
          </span>
          <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
            KINETIC BASKET TWIST
          </span>
        </div>

        {/* Intro */}
        <div style={{
          padding: 'clamp(80px, 12vh, 140px) clamp(80px, 10vw, 160px)',
          maxWidth: '720px',
        }}>
          <p style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '24px' }}>
            KINETIC BASKET TWIST
          </p>
          <h1 style={{ fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.015em', marginBottom: '28px' }}>
            Forged ornament.<br />Scroll indicator.
          </h1>
          <p style={{ fontSize: 'clamp(15px, 1vw, 17px)', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            A wrought-iron basket twist rendered via 3D helix projection. Collapses to a thin line at rest. Inflates and rotates under scroll momentum. Scroll slowly, quickly, and stop — observe the physics.
          </p>
        </div>

        {/* Spec sections */}
        {SECTIONS.map((s, i) => (
          <div
            key={s.label}
            style={{
              padding: 'clamp(60px, 8vh, 100px) clamp(80px, 10vw, 160px)',
              borderTop: '1px solid var(--border-rest)',
              display: 'grid',
              gridTemplateColumns: '1fr 2fr',
              gap: '48px',
              alignItems: 'start',
            }}
          >
            <div>
              <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <p style={{ fontSize: 'clamp(15px, 1vw, 17px)', fontWeight: 600, marginTop: '12px' }}>
                {s.label}
              </p>
            </div>
            <p style={{ fontSize: 'clamp(15px, 1vw, 17px)', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
              {s.body}
            </p>
          </div>
        ))}

        <div style={{ height: 'clamp(100px, 15vh, 180px)' }} />
      </div>
    </>
  );
}
