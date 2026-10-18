import type { Metadata } from 'next';
import LoreChrome from './LoreChrome';
import { loreContributions } from './lore';
import { pageMeta } from '@/lib/metadata';

export const metadata: Metadata = pageMeta({
  title: 'Lore',
  description: 'Links to Vidhu Sarwal\'s Linux kernel patches on lore.kernel.org.',
  path: '/lore',
});

export default function LorePage() {
  const contributions = loreContributions();

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
