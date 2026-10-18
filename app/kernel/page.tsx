import type { Metadata } from 'next';
import KernelNav from './KernelNav';
import KernelView from './KernelView';
import { STATUS_META, statusesPresent, type KernelContribution } from './kernel';
import contributionsData from '@/data/kernel-contributions.json';
import { pageMeta } from '@/lib/metadata';

export const metadata: Metadata = pageMeta({
  title: 'Kernel Contributions',
  description:
    'Upstream Linux kernel patches by Vidhu Sarwal — bug fixes, driver work, and subsystem contributions submitted to lore.kernel.org.',
  path: '/kernel',
});

export default function KernelPage() {
  const { contributions } = contributionsData as {
    contributions: KernelContribution[];
  };

  // Derive counts per present status from the actual array — never drift from
  // what's rendered, and never drop a status the header didn't hardcode.
  const total = contributions.length;
  const counts = statusesPresent(contributions).map((s) => ({
    status: s,
    label: STATUS_META[s].label,
    count: contributions.filter((p) => p.status === s).length,
  }));

  return (
    <>
      <KernelNav />

      <main style={{ paddingTop: 'clamp(120px, 18vh, 180px)', paddingBottom: 'clamp(80px, 10vh, 120px)' }}>
        <div className="content-grid w-full">
          <div className="col-span-12">

            <p className="text-mono" style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              01 / KERNEL PATCHES
            </p>

            <h1 className="text-section" style={{ color: 'var(--text-primary)', marginBottom: '24px' }}>
              Linux Kernel<br />Contributions.
            </h1>

            <p className="text-mono" style={{ color: 'var(--text-secondary)', marginBottom: '28px' }}>
              {total} PATCHES
              {counts.map(({ status, label, count }) => (
                <span key={status}>
                  <span style={{ color: 'var(--text-tertiary)', margin: '0 10px' }}>·</span>
                  <span style={{ color: status === 'merged' ? 'var(--accent)' : undefined }}>
                    {count} {label}
                  </span>
                </span>
              ))}
            </p>

            <KernelView contributions={contributions} />

            <p
              className="text-mono"
              style={{ color: 'var(--text-tertiary)', marginTop: '48px', fontSize: '10px', letterSpacing: '0.16em' }}
            >
              ↳ ALL PATCHES SUBMITTED VIA LORE.KERNEL.ORG · GIT SEND-EMAIL WORKFLOW
            </p>

          </div>
        </div>
      </main>

    </>
  );
}
