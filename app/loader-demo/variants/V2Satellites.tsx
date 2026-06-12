'use client';

import { useEffect, useRef } from 'react';
import LogoText from './LogoText';

const ORBITS = [
  { rFrac: 0.18, dash: [4, 6],       opacity: 0.12, width: 0.5 },
  { rFrac: 0.30, dash: [1.5, 4],     opacity: 0.10, width: 0.5 },
  { rFrac: 0.42, dash: [6, 3, 1, 3], opacity: 0.08, width: 0.5 },
  { rFrac: 0.57, dash: [2, 7],       opacity: 0.07, width: 0.5 },
] as const;

type Shape = 'dot' | 'line' | 'capsule' | 'tick';
const FRAGS: Array<{ orbit: number; angle: number; speed: number; shape: Shape; size: number }> = [
  { orbit: 0, angle: 0.8,       speed:  0.55, shape: 'dot',     size: 2.5 },
  { orbit: 1, angle: 2.6,       speed: -0.35, shape: 'line',    size: 9 },
  { orbit: 2, angle: 1.2,       speed:  0.22, shape: 'capsule', size: 7 },
  { orbit: 3, angle: 4.1,       speed:  0.13, shape: 'dot',     size: 3.5 },
  { orbit: 1, angle: Math.PI,   speed: -0.35, shape: 'tick',    size: 5 },
  { orbit: 2, angle: Math.PI+1, speed:  0.22, shape: 'dot',     size: 1.8 },
];

function drawFrag(ctx: CanvasRenderingContext2D, shape: Shape, x: number, y: number, angle: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.2;

  switch (shape) {
    case 'dot':
      ctx.beginPath(); ctx.arc(0, 0, size, 0, Math.PI * 2); ctx.fill();
      break;
    case 'line':
      ctx.rotate(angle + Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(-size/2, 0); ctx.lineTo(size/2, 0); ctx.stroke();
      break;
    case 'capsule':
      ctx.rotate(angle + Math.PI / 2);
      ctx.beginPath(); ctx.roundRect(-size/2, -1, size, 2, 1); ctx.fill();
      break;
    case 'tick':
      ctx.rotate(angle + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -size/2); ctx.lineTo(0, size/2);
      ctx.moveTo(-2, -size/2); ctx.lineTo(2, -size/2);
      ctx.stroke();
      break;
  }
  ctx.restore();
}

interface Props { logoScale?: number; ringsScale?: number; glitch?: boolean; }

export default function V2Satellites({ logoScale = 0.75, ringsScale = 0.55 }: Props) {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const ringsScaleRef = useRef(ringsScale);
  useEffect(() => { ringsScaleRef.current = ringsScale; }, [ringsScale]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;
    const angles = FRAGS.map(f => f.angle);
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

      ORBITS.forEach(orbit => {
        ctx.save();
        ctx.strokeStyle = `rgba(0,0,0,${orbit.opacity})`;
        ctx.lineWidth   = orbit.width;
        ctx.setLineDash([...orbit.dash]);
        ctx.beginPath();
        ctx.arc(cx, cy, dim * orbit.rFrac * rs, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      FRAGS.forEach((frag, i) => {
        angles[i] += frag.speed * dt;
        const r = dim * ORBITS[frag.orbit].rFrac * rs;
        const x = cx + Math.cos(angles[i]) * r;
        const y = cy + Math.sin(angles[i]) * r;
        drawFrag(ctx, frag.shape, x, y, angles[i], frag.size);
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
