import { ImageResponse } from 'next/og';
import { OG, loadOgFonts } from '@/lib/og/card';

// Home-screen icon for iOS, also used by iMessage and some chat apps as the
// link-preview fallback when a page has no og:image. The VX. mark, inset so
// iOS's rounded-corner mask doesn't clip the frame.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default async function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: OG.bg,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 120,
            height: 120,
            border: `5px solid ${OG.ink}`,
            fontFamily: 'Space Grotesk',
            fontWeight: 700,
            fontSize: 46,
            letterSpacing: -1.5,
            color: OG.ink,
          }}
        >
          VX.
        </div>
      </div>
    ),
    { ...size, fonts: await loadOgFonts() },
  );
}
