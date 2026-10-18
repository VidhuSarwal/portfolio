import { ImageResponse } from 'next/og';
import { CardFrame, Mono, OG, OG_SIZE, VXMark, loadOgFonts } from './card';
import {
  STATUS_META,
  statusesPresent,
  subsystemsPresent,
  type KernelContribution,
} from '@/app/kernel/kernel';

// Social card for the kernel-patch routes (/kernel, /lore). Counts are derived
// from the same list the page renders, so the card never drifts from the page
// when patches are added or change status.

export function kernelCardAlt(contributions: KernelContribution[]): string {
  const merged = contributions.filter((c) => c.status === 'merged').length;
  return `Linux kernel contributions by Vidhu Sarwal — ${contributions.length} upstream patches, ${merged} merged.`;
}

export async function kernelCard({
  eyebrow,
  url,
  title,
  contributions,
}: {
  eyebrow: string;
  url: string;
  title: [string, string];
  contributions: KernelContribution[];
}) {
  const stats = [
    { n: contributions.length, label: 'PATCHES', accent: false },
    ...statusesPresent(contributions).map((s) => ({
      n: contributions.filter((c) => c.status === s).length,
      label: STATUS_META[s].label,
      accent: s === 'merged',
    })),
  ];

  return new ImageResponse(
    (
      <CardFrame eyebrow={eyebrow} url={url}>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 40 }}>
          {title.map((line) => (
            <div key={line} style={{ display: 'flex', fontSize: 92, fontWeight: 700, letterSpacing: -2, lineHeight: 1 }}>
              {line}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex' }}>
              {stats.map((s) => (
                <div key={s.label} style={{ display: 'flex', flexDirection: 'column', marginRight: 64 }}>
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 72,
                      fontWeight: 700,
                      lineHeight: 1,
                      color: s.accent ? OG.accent : OG.ink,
                    }}
                  >
                    {String(s.n)}
                  </div>
                  <div style={{ display: 'flex', marginTop: 10 }}>
                    <Mono color={s.accent ? OG.accent : OG.secondary} size={16}>{s.label}</Mono>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', marginTop: 28, paddingTop: 14, borderTop: `1px solid ${OG.hairline}`, width: 700 }}>
              <Mono color={OG.secondary} size={16}>
                {`Vidhu Sarwal · ${subsystemsPresent(contributions).join(' · ')}`}
              </Mono>
            </div>
          </div>
          <VXMark />
        </div>
      </CardFrame>
    ),
    { ...OG_SIZE, fonts: await loadOgFonts() },
  );
}
