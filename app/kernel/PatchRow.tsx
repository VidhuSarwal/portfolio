'use client';

import { STATUS_META, toneColor, type KernelContribution } from './kernel';

export type { KernelContribution };

export default function PatchRow({ patch }: { patch: KernelContribution }) {
  const { dot, label, tone } = STATUS_META[patch.status];

  return (
    <div style={{ padding: '28px 0', borderBottom: '1px solid var(--border-rest)' }}>
      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <span className="text-mono" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>
          {patch.date}
        </span>

        <span className="tag">{patch.subsystem}</span>

        <span
          className="text-mono"
          style={{
            color: toneColor(tone),
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            flexShrink: 0,
          }}
        >
          {dot} {label}
        </span>

        {patch.version && (
          <span className="text-mono" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>
            {patch.version}
          </span>
        )}
      </div>

      {/* Title + lore link */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <p className="text-body" style={{ color: 'var(--text-primary)', fontWeight: 500, margin: 0, flex: '1 1 0', minWidth: 0 }}>
          {patch.title}
        </p>

        <a
          href={patch.lore_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-mono"
          style={{ color: 'var(--text-secondary)', textDecoration: 'none', flexShrink: 0, letterSpacing: '0.12em', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 16px', border: '1px solid var(--border-rest)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)'; }}
        >
          <span aria-hidden="true">↗</span> LORE.KERNEL.ORG
        </a>
      </div>

      {/* Description */}
      <p className="text-body" style={{ color: 'var(--text-secondary)', margin: 0, maxWidth: '72ch' }}>
        {patch.description}
      </p>
    </div>
  );
}
