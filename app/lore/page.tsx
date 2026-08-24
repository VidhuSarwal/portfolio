import type { Metadata } from 'next';
import contributionsData from '@/data/kernel-contributions.json';
import type { KernelContribution } from '../kernel/kernel';
import LoreChrome from './LoreChrome';

export const metadata: Metadata = {
  title: 'Lore',
  description: 'Links to Vidhu Sarwal\'s Linux kernel patches on lore.kernel.org.',
};

export default function LorePage() {
  const { contributions: allContributions } = contributionsData as {
    contributions: KernelContribution[];
  };

  // This page's own curated order — excludes the NTFS3 RFC and pushes the
  // two STAGING/ipu7 patches to the end. Doesn't touch the shared JSON, so
  // /kernel's ordering and counts are unaffected.
  const contributions = [
    ...allContributions.filter((c) => c.subsystem !== 'NTFS3' && c.subsystem !== 'STAGING'),
    ...allContributions.filter((c) => c.subsystem === 'STAGING'),
  ];

  return (
    <>
      <LoreChrome />
      <main style={{ background: '#000', color: '#fff', maxWidth: '900px', margin: '0 auto', padding: '2em 1em' }}>
        <h1>Vidhu Sarwal — Linux Kernel Patches</h1>
        <p>
          {contributions.length} patches, submitted via{' '}
          <a href="https://lore.kernel.org/" target="_blank" rel="noopener noreferrer">lore.kernel.org</a> / git send-email.
        </p>
        <p style={{ fontSize: '0.85em', color: '#888' }}>(Descriptions automatically summarised using AI)</p>

        <hr />

        {contributions.map((c) => (
          <div key={c.id}>
            <h3>
              <a href={c.lore_url} target="_blank" rel="noopener noreferrer">{c.title}</a>
            </h3>
            <p style={{ color: '#aaa' }}>
              <em>
                {c.subsystem} · {c.date} · {c.status.toUpperCase()}
                {c.version ? ` · ${c.version}` : ''}
              </em>
            </p>
            <p>{c.description}</p>
            <p>
              <a href={c.lore_url} target="_blank" rel="noopener noreferrer">view thread on lore.kernel.org</a>
            </p>
            <hr />
          </div>
        ))}
      </main>
    </>
  );
}
