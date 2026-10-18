import { ImageResponse } from 'next/og';
import { CardFrame, Mono, OG, OG_SIZE, VXMark, loadOgFonts } from '@/lib/og/card';
import { CREDENTIALS, KERNEL_SUBSYSTEMS } from '@/lib/credentials';

// X shows large link cards as the image alone (plus a small domain overlay),
// and renders them ~360–506px wide — so the card works like a business card:
// few elements, large type. Identity on top, a hairline "fold", credentials
// below, mark bottom-right.
export const alt = `Vidhu Sarwal — Systems Engineer and Linux kernel contributor (${KERNEL_SUBSYSTEMS.join(', ')}). ${CREDENTIALS.map((c) => c.short).join(' · ')}.`;
export const size = OG_SIZE;
export const contentType = 'image/png';

function Chip({ children }: { children: string }) {
  return (
    <div
      style={{
        display: 'flex',
        marginRight: 14,
        padding: '7px 16px',
        border: `2px solid ${OG.ink}`,
        borderRadius: 2,
        fontFamily: 'JetBrains Mono',
        fontSize: 22,
        letterSpacing: 2.2,
        color: OG.ink,
      }}
    >
      {children}
    </div>
  );
}

export default async function Image() {
  return new ImageResponse(
    (
      <CardFrame eyebrow="01 / Systems Engineer" url="vidhux.dev">
        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 34 }}>
            <div style={{ display: 'flex', fontSize: 124, fontWeight: 700, letterSpacing: -3, lineHeight: 1 }}>
              Vidhu Sarwal.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 24 }}>
              <div style={{ display: 'flex', fontSize: 46, fontWeight: 500, color: OG.secondary, marginRight: 28 }}>
                Linux Kernel Contributor
              </div>
              {KERNEL_SUBSYSTEMS.map((s) => <Chip key={s}>{s}</Chip>)}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              paddingTop: 26,
              borderTop: `1px solid ${OG.hairline}`,
            }}
          >
            <div style={{ display: 'flex' }}>
              {CREDENTIALS.map((c) => (
                <div key={c.index} style={{ display: 'flex', flexDirection: 'column', marginRight: 56 }}>
                  <div style={{ display: 'flex', fontSize: 34, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1 }}>
                    {c.short}
                  </div>
                  <div style={{ display: 'flex', marginTop: 12 }}>
                    <Mono color={OG.secondary} size={16}>{c.org}</Mono>
                  </div>
                </div>
              ))}
            </div>
            <VXMark size={84} />
          </div>
        </div>
      </CardFrame>
    ),
    { ...size, fonts: await loadOgFonts() },
  );
}
