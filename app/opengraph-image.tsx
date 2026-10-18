import { ImageResponse } from 'next/og';
import { CardFrame, Mono, OG, OG_SIZE, VXMark, loadOgFonts } from '@/lib/og/card';
import { CREDENTIALS } from '@/lib/credentials';

// X shows large link cards as the image alone (plus a small domain overlay),
// so name, role and credentials are baked into the image, not left to og:title.
export const alt =
  "Vidhu Sarwal — Systems Engineer. Linux kernel, distributed systems, AI infrastructure. LFX Kernel Mentorship '26, GSoC '25 at BeagleBoard.org, Samsung PRISM.";
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <CardFrame eyebrow="01 / Systems Engineer" url="vidhux.dev">
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 44 }}>
          <div style={{ display: 'flex', fontSize: 112, fontWeight: 700, letterSpacing: -2.5, lineHeight: 1 }}>
            Vidhu Sarwal.
          </div>
          <div style={{ display: 'flex', marginTop: 22, fontSize: 32, fontWeight: 500, color: OG.secondary }}>
            Linux kernel · Distributed systems · AI infrastructure.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', width: 700 }}>
            {CREDENTIALS.map((c) => (
              <div
                key={c.index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '9px 0',
                  borderTop: `1px solid ${OG.hairline}`,
                }}
              >
                <Mono color={OG.tertiary} size={16}>{c.index}</Mono>
                <div style={{ display: 'flex', marginLeft: 22, flexGrow: 1 }}>
                  <Mono size={16}>{c.label}</Mono>
                </div>
                <Mono color={OG.secondary} size={16}>{c.year}</Mono>
              </div>
            ))}
          </div>
          <VXMark />
        </div>
      </CardFrame>
    ),
    { ...size, fonts: await loadOgFonts() },
  );
}
