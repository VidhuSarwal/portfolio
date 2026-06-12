'use client';

import { useState } from 'react';
import V1Rings      from './variants/V1Rings';
import V2Satellites from './variants/V2Satellites';
import V3Orbital    from './variants/V3Orbital';
import V4Blueprint  from './variants/V4Blueprint';

const VARIANTS = [
  { id: 1, label: '01 · RINGS',      hasRings: true,  Component: V1Rings },
  { id: 2, label: '02 · SATELLITES', hasRings: true,  Component: V2Satellites },
  { id: 3, label: '03 · ORBITAL',    hasRings: true,  Component: V3Orbital },
  { id: 4, label: '04 · BLUEPRINT',  hasRings: false, Component: V4Blueprint },
] as const;

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '9px',
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  whiteSpace: 'nowrap' as const,
};

function Slider({
  label, value, min, max, step, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ ...mono, color: 'rgba(0,0,0,0.35)', width: '72px' }}>{label}</span>
      <input
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '120px', accentColor: '#000', cursor: 'pointer' }}
      />
      <span style={{ ...mono, color: '#000', width: '36px', textAlign: 'right' }}>
        {value.toFixed(2)}
      </span>
    </div>
  );
}

export default function LoaderDemoClient() {
  const [active,       setActive]      = useState(4);
  const [logoScale,    setLogoScale]   = useState(0.90);
  const [ringsScale,   setRingsScale]  = useState(0.55);
  const [glitch,       setGlitch]      = useState(true);

  const variant = VARIANTS.find(v => v.id === active)!;
  const { Component } = variant;

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#fff',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Space Grotesk', system-ui, sans-serif",
    }}>

      {/* ── Controls strip ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', flexWrap: 'wrap',
        gap: '8px', padding: '10px 16px',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        background: '#fff', flexShrink: 0,
      }}>

        {/* Variant tabs */}
        <div style={{ display: 'flex', gap: '2px', marginRight: '16px' }}>
          {VARIANTS.map(v => (
            <button key={v.id} onClick={() => setActive(v.id)} style={{
              ...mono,
              background: active === v.id ? '#000' : 'transparent',
              color: active === v.id ? '#fff' : 'rgba(0,0,0,0.35)',
              border: '1px solid',
              borderColor: active === v.id ? '#000' : 'rgba(0,0,0,0.12)',
              padding: '5px 12px', cursor: 'pointer',
            }}>
              {v.label}
            </button>
          ))}
        </div>

        <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.1)', margin: '0 4px' }} />

        {/* Sliders */}
        <Slider label="LOGO SIZE" value={logoScale} min={0.30} max={1.50} step={0.05}
          onChange={setLogoScale} />

        {variant.hasRings && (
          <Slider label="RINGS SIZE" value={ringsScale} min={0.20} max={1.20} step={0.05}
            onChange={setRingsScale} />
        )}

        {/* Glitch toggle — only for V4 */}
        {active === 4 && (
          <>
            <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.1)', margin: '0 4px' }} />
            <button onClick={() => setGlitch(g => !g)} style={{
              ...mono,
              background: glitch ? '#000' : 'transparent',
              color: glitch ? '#fff' : 'rgba(0,0,0,0.35)',
              border: '1px solid',
              borderColor: glitch ? '#000' : 'rgba(0,0,0,0.12)',
              padding: '5px 12px', cursor: 'pointer',
            }}>
              GLITCH {glitch ? 'ON' : 'OFF'}
            </button>
          </>
        )}

        <span style={{ ...mono, color: 'rgba(0,0,0,0.18)', marginLeft: 'auto' }}>
          RELOAD TO RESTART
        </span>
      </div>

      {/* ── Full-white preview ──────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', background: '#fff', overflow: 'hidden' }}>
        <Component
          key={active}
          logoScale={logoScale}
          ringsScale={ringsScale}
          glitch={glitch}
        />
      </div>
    </div>
  );
}
