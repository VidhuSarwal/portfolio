'use client';

import { useEffect, useRef } from 'react';
import LogoText from './LogoText';

const PATHS = [
  { rFrac: 0.23, dash: [] as number[], opacity: 0.45, width: 0.6 },
  { rFrac: 0.36, dash: [6, 4],         opacity: 0.30, width: 0.5 },
  { rFrac: 0.52, dash: [1.5, 3.5],     opacity: 0.20, width: 0.5 },
] as const;

const BODIES = [
  { path: 0, angle: 0.5,  speed:  0.36, r: 4.5 },
  { path: 1, angle: 2.1,  speed: -0.22, r: 3.0 },
  { path: 2, angle: 4.0,  speed:  0.13, r: 6.5 },
] as const;

interface Props { logoScale?: number; ringsScale?: number; glitch?: boolean; }

export default function V3Orbital({ logoScale = 0.75, ringsScale = 0.55 }: Props) {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const ringsScaleRef = useRef(ringsScale);
  useEffect(() => { ringsScaleRef.current = ringsScale; }, [ringsScale]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;
    const angles = BODIES.map(b => b.angle);
    let prevTs = 0, animId = 0;

    const ro = new ResizeObserver(() => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    ro.observe(canvas);
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    function draw(ts: number) {
      const dt = prevTs ? (ts - prevTs) / 1000 : 0;
      prevTs   = ts;
      const rs = ringsScaleRef.current;

      const W   = canvas.width;
      const H   = canvas.height;
      const cx  = W / 2;
      const cy  = H / 2;
      const dim = Math.min(W, H);

      ctx.clearRect(0, 0, W, H);

      PATHS.forEach(path => {
        ctx.save();
        ctx.strokeStyle = `rgba(0,0,0,${path.opacity})`;
        ctx.lineWidth   = path.width;
        ctx.setLineDash([...path.dash]);
        ctx.beginPath();
        ctx.arc(cx, cy, dim * path.rFrac * rs, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      // Faint core dot
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      BODIES.forEach((body, i) => {
        angles[i] += body.speed * dt;
        const r = dim * PATHS[body.path].rFrac * rs;
        const x = cx + Math.cos(angles[i]) * r;
        const y = cy + Math.sin(angles[i]) * r;

        // Faint radial line
        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,0,0.04)';
        ctx.lineWidth   = 0.4;
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(x, y, body.r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#fff' }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)', zIndex: 2,
      }}>
        <LogoText logoScale={logoScale} />
      </div>
      <canvas ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }} />
    </div>
  );
}
