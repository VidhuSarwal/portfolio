// Single source of truth for kernel-contribution status vocabulary + types.
// Shared by page.tsx (server, count derivation), PatchRow, KernelView, Timeline.

export type KernelStatus = 'merged' | 'sent' | 'rfc' | 'pending' | 'rejected';

export interface KernelContribution {
  id: string;
  title: string;
  subsystem: string;
  date: string;
  status: KernelStatus;
  version: string | null;
  description: string;
  lore_url: string;
}

type Tone = 'accent' | 'secondary' | 'tertiary';

export interface StatusMeta {
  dot: string;
  label: string;
  tone: Tone;
}

// Ordered by patch lifecycle: applied → under review → proposal → withdrawn.
export const STATUS_ORDER: KernelStatus[] = ['merged', 'sent', 'rfc', 'pending', 'rejected'];

export const STATUS_META: Record<KernelStatus, StatusMeta> = {
  merged:   { dot: '●', label: 'MERGED',    tone: 'accent' },
  sent:     { dot: '◐', label: 'SENT',      tone: 'secondary' },
  rfc:      { dot: '◇', label: 'RFC',       tone: 'secondary' },
  pending:  { dot: '○', label: 'IN REVIEW', tone: 'secondary' },
  rejected: { dot: '✕', label: 'REJECTED',  tone: 'tertiary' },
};

export function toneColor(tone: Tone): string {
  return tone === 'accent'
    ? 'var(--accent)'
    : tone === 'tertiary'
      ? 'var(--text-tertiary)'
      : 'var(--text-secondary)';
}

// Statuses that actually appear in a data set, in canonical order — used to
// derive filter chips so a chip is never a dead control.
export function statusesPresent(contributions: KernelContribution[]): KernelStatus[] {
  return STATUS_ORDER.filter((s) => contributions.some((c) => c.status === s));
}

// Distinct subsystems present, sorted alphabetically — drives the subsystem
// filter chips so a chip is never a dead control.
export function subsystemsPresent(contributions: KernelContribution[]): string[] {
  return [...new Set(contributions.map((c) => c.subsystem))].sort();
}
