'use client';

import { useMemo, useState } from 'react';
import PatchRow from './PatchRow';
import Timeline from './Timeline';
import {
  STATUS_META,
  statusesPresent,
  subsystemsPresent,
  type KernelContribution,
  type KernelStatus,
} from './kernel';

type View = 'ledger' | 'timeline';
type StatusFilter = KernelStatus | 'all';
type SubsystemFilter = string | 'all';

export default function KernelView({ contributions }: { contributions: KernelContribution[] }) {
  const [view, setView] = useState<View>('ledger');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [subsystem, setSubsystem] = useState<SubsystemFilter>('all');

  const statuses = useMemo(() => statusesPresent(contributions), [contributions]);
  const subsystems = useMemo(() => subsystemsPresent(contributions), [contributions]);

  const filtered = useMemo(
    () =>
      contributions.filter(
        (c) => (status === 'all' || c.status === status) && (subsystem === 'all' || c.subsystem === subsystem),
      ),
    [contributions, status, subsystem],
  );

  return (
    <div>
      {/* ─── Controls ─────────────────────────────────────────────── */}
      <div className="kv-controls">
        {/* View toggle */}
        <div className="kv-toggle" role="group" aria-label="Layout">
          <button
            type="button"
            className={`view-btn text-mono ${view === 'ledger' ? 'is-active' : ''}`}
            aria-pressed={view === 'ledger'}
            onClick={() => setView('ledger')}
          >
            Ledger
          </button>
          <button
            type="button"
            className={`view-btn text-mono ${view === 'timeline' ? 'is-active' : ''}`}
            aria-pressed={view === 'timeline'}
            onClick={() => setView('timeline')}
          >
            Timeline
          </button>
        </div>

        {/* Live count */}
        <span className="text-mono kv-count">
          {filtered.length} of {contributions.length} shown
        </span>
      </div>

      {/* Status chips */}
      <div className="kv-chips" role="group" aria-label="Filter by status">
        <Chip active={status === 'all'} onClick={() => setStatus('all')}>
          All
        </Chip>
        {statuses.map((s) => (
          <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
            {STATUS_META[s].label}
          </Chip>
        ))}
      </div>

      {/* Subsystem chips */}
      <div className="kv-chips" role="group" aria-label="Filter by subsystem" style={{ marginTop: '10px' }}>
        <Chip active={subsystem === 'all'} onClick={() => setSubsystem('all')}>
          All Subsystems
        </Chip>
        {subsystems.map((s) => (
          <Chip key={s} active={subsystem === s} onClick={() => setSubsystem(s)}>
            {s}
          </Chip>
        ))}
      </div>

      <span className="sep-line" style={{ marginTop: '28px', marginBottom: '0' }} />

      {/* ─── List ─────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <p className="text-mono" style={{ color: 'var(--text-tertiary)', padding: '40px 0' }}>
          No patches match this filter.
        </p>
      ) : view === 'timeline' ? (
        <Timeline contributions={filtered} />
      ) : (
        <div role="list" aria-label="Kernel patch contributions">
          {filtered.map((patch) => (
            <div key={patch.id} role="listitem">
              <PatchRow patch={patch} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`chip text-mono ${active ? 'is-active' : ''}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
