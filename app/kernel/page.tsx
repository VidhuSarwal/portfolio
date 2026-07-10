import type { Metadata } from 'next';
import KernelNav from './KernelNav';
import PatchRow, { type KernelContribution } from './PatchRow';
import contributionsData from '@/data/kernel-contributions.json';

export const metadata: Metadata = {
  title: 'Kernel Contributions',
  description:
    'Upstream Linux kernel patches by Vidhu Sarwal — bug fixes, driver work, and subsystem contributions submitted to lore.kernel.org.',
};

export default function KernelPage() {
  const { contributions } = contributionsData as {
    meta: { total: number; merged: number; pending: number };
    contributions: KernelContribution[];
  };

  // Derive counts from the actual array — never drift from what's rendered
  const total   = contributions.length;
  const merged  = contributions.filter(p => p.status === 'merged').length;
  const pending = contributions.filter(p => p.status === 'pending').length;

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

            <p className="text-mono" style={{ color: 'var(--text-secondary)', marginBottom: '0' }}>
              {total} PATCHES
              <span style={{ color: 'var(--text-tertiary)', margin: '0 10px' }}>·</span>
              <span style={{ color: 'var(--accent)' }}>{merged} MERGED</span>
              {pending > 0 && (
                <>
                  <span style={{ color: 'var(--text-tertiary)', margin: '0 10px' }}>·</span>
                  {pending} IN REVIEW
                </>
              )}
            </p>

            <span className="sep-line" style={{ marginTop: '28px', marginBottom: '0' }} />

            <div role="list" aria-label="Kernel patch contributions">
              {contributions.map((patch) => (
                <div key={patch.id} role="listitem">
                  <PatchRow patch={patch} />
                </div>
              ))}
            </div>

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
