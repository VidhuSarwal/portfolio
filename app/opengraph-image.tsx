import { ImageResponse } from 'next/og';
import { Bracket, Grid, Mono, OG, OG_SIZE, VXMark, loadOgFonts } from '@/lib/og/card';
import { CREDENTIALS, KERNEL_SUBSYSTEMS } from '@/lib/credentials';

// Open Graph card — read by WhatsApp, LinkedIn, Slack, Discord, iMessage and
// Facebook (X has its own, twitter-image.tsx). These show the image wide with
// og:title / og:description printed underneath, but WhatsApp falls back to a
// centre-cropped square thumbnail. So everything that identifies the card sits
// in the centre 630×630; the wings hold only sheet furniture the crop can lose.
export const alt = `Vidhu Sarwal — Systems Engineer and Linux kernel contributor (${KERNEL_SUBSYSTEMS.join(', ')}). ${CREDENTIALS.map((c) => c.short).join(' · ')}.`;
export const size = OG_SIZE;
export const contentType = 'image/png';

const SAFE = OG_SIZE.height;                  // square-safe column width
const WING = (OG_SIZE.width - SAFE) / 2;      // 285px each side
const GUIDE_INSET = 18;                       // panel guides sit just inside the crop

function Chip({ children }: { children: string }) {
  return (
    <div
      style={{
        display: 'flex',
        margin: '0 7px',
        padding: '6px 14px',
        border: `2px solid ${OG.ink}`,
        borderRadius: 2,
        fontFamily: 'JetBrains Mono',
        fontSize: 20,
        letterSpacing: 2,
        color: OG.ink,
      }}
    >
      {children}
    </div>
  );
}

// Dashed vertical guides framing the safe column, with end ticks — reads as a
// drawing viewport on the wide card and as a quiet border on the square crop.
function PanelGuides() {
  const { width, height } = OG_SIZE;
  const y0 = 80, y1 = height - 80;
  const xs = [WING + GUIDE_INSET, width - WING - GUIDE_INSET];
  return (
    <svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
      {xs.map((x) => (
        <g key={x}>
          <line x1={x} y1={y0} x2={x} y2={y1} stroke={OG.hairline} strokeWidth={2} strokeDasharray="6 8" />
          <line x1={x - 8} y1={y0} x2={x + 8} y2={y0} stroke={OG.tertiary} strokeWidth={2} />
          <line x1={x - 8} y1={y1} x2={x + 8} y2={y1} stroke={OG.tertiary} strokeWidth={2} />
        </g>
      ))}
    </svg>
  );
}

function Corner({ children, top, left, color = OG.secondary }: { children: string; top: boolean; left: boolean; color?: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        ...(top ? { top: 66 } : { bottom: 66 }),
        ...(left ? { left: 80 } : { right: 80 }),
      }}
    >
      <Mono color={color} size={16}>{children}</Mono>
    </div>
  );
}

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          width: '100%',
          height: '100%',
          background: OG.bg,
          color: OG.ink,
          fontFamily: 'Space Grotesk',
        }}
      >
        <Grid />
        <Bracket corner="tl" />
        <Bracket corner="tr" />
        <Bracket corner="bl" />
        <Bracket corner="br" />
        <PanelGuides />

        <Corner top left color={OG.ink}>vidhux.dev</Corner>
        <Corner top left={false}>Systems Engineer</Corner>
        <Corner top={false} left>DWG VX-01</Corner>
        <Corner top={false} left={false}>Rev.B</Corner>

        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: WING,
            width: SAFE,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <VXMark size={64} />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: 30,
              fontSize: 108,
              fontWeight: 700,
              letterSpacing: -3,
              lineHeight: 0.98,
            }}
          >
            <div style={{ display: 'flex' }}>Vidhu</div>
            <div style={{ display: 'flex' }}>Sarwal.</div>
          </div>

          <div style={{ display: 'flex', marginTop: 22, fontSize: 32, fontWeight: 500, color: OG.secondary }}>
            Linux Kernel Contributor
          </div>

          <div style={{ display: 'flex', marginTop: 20 }}>
            {KERNEL_SUBSYSTEMS.map((s) => <Chip key={s}>{s}</Chip>)}
          </div>

          <div style={{ display: 'flex', marginTop: 30 }}>
            <Mono color={OG.secondary} size={16}>{CREDENTIALS.map((c) => c.short).join('  ·  ')}</Mono>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: await loadOgFonts() },
  );
}
