'use client';

import { useEffect, useRef } from 'react';
import LogoText from './LogoText';

const RINGS = [
  { rFrac: 0.20, dash: [] as number[],    speed:  0.08, opacity: 0.55, width: 0.6 },
  { rFrac: 0.30, dash: [7, 6],            speed: -0.14, opacity: 0.35, width: 0.5 },
  { rFrac: 0.42, dash: [1.5, 5],          speed:  0.05, opacity: 0.25, width: 0.5 },
  { rFrac: 0.56, dash: [10, 8, 2, 8],     speed: -0.03, opacity: 0.15, width: 0.5 },
] as const;

const DOTS = [
  { ring: 0, angle: 0,             speed:  0.40, r: 2.8 },
  { ring: 0, angle: Math.PI,       speed:  0.28, r: 2.0 },
  { ring: 1, angle: Math.PI / 2,   speed: -0.55, r: 2.2 },
  { ring: 1, angle: 3*Math.PI/2,   speed:  0.38, r: 1.6 },
  { ring: 2, angle: Math.PI / 4,   speed:  0.22, r: 2.4 },
  { ring: 3, angle: 2.4,           speed: -0.18, r: 1.8 },
] as const;

interface Props { logoScale?: number; ringsScale?: number; glitch?: boolean; }

export default function V1Rings({ logoScale = 0.75, ringsScale = 0.55 }: Props) {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const logoScaleRef  = useRef(logoScale);
  const ringsScaleRef = useRef(ringsScale);
  useEffect(() => { logoScaleRef.current  = logoScale;  }, [logoScale]);
  useEffect(() => { ringsScaleRef.current = ringsScale; }, [ringsScale]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;
    const angles = DOTS.map(d => d.angle);
    let prevTs = 0, animId = 0;

    const ro = new ResizeObserver(() => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    ro.observe(canvas);
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    function draw(ts: number) {
      const dt  = prevTs ? (ts - prevTs) / 1000 : 0;
      prevTs    = ts;
      const rs  = ringsScaleRef.current;

      const W   = canvas.width;
      const H   = canvas.height;
      const cx  = W / 2;
      const cy  = H / 2;
      const dim = Math.min(W, H);

      ctx.clearRect(0, 0, W, H);

      RINGS.forEach(ring => {
        const r   = dim * ring.rFrac * rs;
        const rot = ring.speed * (ts / 1000);
        ctx.save();
        ctx.strokeStyle = `rgba(0,0,0,${ring.opacity})`;
        ctx.lineWidth   = ring.width;
        ctx.setLineDash([...ring.dash]);
        ctx.lineDashOffset = -rot * r * 0.6;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      DOTS.forEach((dot, i) => {
        angles[i] += dot.speed * dt;
        const r = dim * RINGS[dot.ring].rFrac * rs;
        const x = cx + Math.cos(angles[i]) * r;
        const y = cy + Math.sin(angles[i]) * r;
        ctx.save();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x, y, dot.r, 0, Math.PI * 2);
        ctx.fill();
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
        transform: 'translate(-50%, -50%)',
        zIndex: 2,
      }}>
        <LogoText logoScale={logoScale} />
      </div>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}
      />
    </div>
  );
}
