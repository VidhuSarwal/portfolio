interface Props {
  logoScale?: number;
}

export default function LogoText({ logoScale = 0.75 }: Props) {
  const vxSize    = Math.round(72 * logoScale);
  const worksSize = Math.round(vxSize * 0.155);

  return (
    <div style={{ color: '#000', userSelect: 'none', pointerEvents: 'none', textAlign: 'center' }}>
      {/* VX — tight letter-spacing, NOT space-between */}
      <div style={{
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        fontSize:   `${vxSize}px`,
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: '0.06em',
        color: '#000',
      }}>
        VX
      </div>
      {/* WORKS — same optical width via letter-spacing */}
      <div style={{
        fontFamily:    "'Space Grotesk', system-ui, sans-serif",
        fontSize:      `${worksSize}px`,
        fontWeight:    500,
        letterSpacing: '0.48em',
        paddingLeft:   '0.48em',   // offset trailing letter-spacing
        color: '#000',
        marginTop: `${Math.round(vxSize * 0.06)}px`,
      }}>
        WORKS
      </div>
    </div>
  );
}
