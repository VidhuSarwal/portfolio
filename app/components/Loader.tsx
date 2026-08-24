'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLoader } from '@/app/providers/LoaderContext';

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789─│┤├┬┴·▪';
function randChar() { return CHARSET[Math.floor(Math.random() * CHARSET.length)]; }

const T_OUTER_END    = 0.7;
const T_CORNER_START = 0.2;
const T_CORNER_END   = 0.9;
const T_EXT_START    = 0.6;
const T_EXT_END      = 1.5;
const T_CALL_START   = 0.9;
const T_CALL_END     = 1.5;
const T_CIPHER_START = 1.2;
const T_GLITCH_START = 0.5;
const T_SETTLE       = 3.0;
const LOGO_SCALE     = 0.90;

const LOCK_TIMES: Record<string, number> = {
  V: 1.9, X: 2.1, W: 2.2, O: 2.3, R: 2.35, K: 2.4, S: 2.5,
};

function prog(t: number, s: number, e: number) {
  return Math.max(0, Math.min(1, (t - s) / (e - s)));
}
function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }

type GlitchKind = 'char' | 'rect' | 'triangle' | 'diamond';
interface GlitchPt {
  x: number; y: number; kind: GlitchKind; char: string;
  size: number; opacity: number; maxLife: number; life: number; rot: number;
}

// Animation settles at 3.0s, then 2.0s dwell, then curtain up in 0.55s
const CURTAIN_DELAY = 5000;
const CURTAIN_DUR   = 550;

export default function Loader() {
  const { markDone } = useLoader();
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'visible' | 'curtain' | 'done'>('visible');
  const pathname = usePathname();
  const bare = pathname === '/lore';

  // Plain pages (e.g. /lore) skip the splash entirely — mark done immediately.
  useEffect(() => {
    if (bare) markDone();
  }, [bare, markDone]);

  // Blueprint canvas animation
  useEffect(() => {
    if (bare) return;
    const canvas = canvasRef.current!;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let startTs = 0, prevTs = 0, animId = 0, lastSpawn = 0;

    const glitchPts: GlitchPt[] = [];
    const vxChars    = ['V', 'X'].map(c => ({ final: c, display: randChar(), locked: false }));
    const worksChars = ['W', 'O', 'R', 'K', 'S'].map(c => ({ final: c, display: randChar(), locked: false }));

    let fixedLayout: {
      sqSize: number; sqX: number; sqY: number;
      blockW: number; cx: number; cy: number;
      vxSize: number; worksSize: number;
      vxY: number; worksY: number;
      vxLeft: number; xLeft: number;
      worksXs: number[];
      callX: number; callY: number; callW: number; callH: number; callCY: number;
      zoneMargin: number; armLen: number;
    } | null = null;

    function computeFixed(W: number, H: number) {
      const cx = W / 2;
      const cy = H / 2;
      const sqSize = Math.min(W, H) * 0.72;
      const sqX    = cx - sqSize / 2;
      const sqY    = cy - sqSize / 2;

      const vxSize    = Math.min(sqSize * 0.20, 96) * LOGO_SCALE;
      const worksSize = vxSize * 0.155;

      ctx.font = `700 ${vxSize}px 'Space Grotesk', system-ui, sans-serif`;
      const vMet  = ctx.measureText('V');
      const xMet  = ctx.measureText('X');
      const vW    = vMet.width;
      const xW    = xMet.width;
      const vxCap = vMet.actualBoundingBoxAscent;

      const blockW = vW + vxSize * 0.08 + xW;
      const vxLeft = cx - blockW / 2;
      const xLeft  = cx + blockW / 2 - xW;

      ctx.font = `500 ${worksSize}px 'Space Grotesk', system-ui, sans-serif`;
      const worksCap = ctx.measureText('W').actualBoundingBoxAscent;

      const rowGap   = vxSize * 0.10;
      const totalH   = vxCap + rowGap + worksCap;
      const blockTop = cy - totalH / 2;
      const vxY      = blockTop + vxCap;
      const worksY   = vxY + rowGap + worksCap;

      const finalWidths = ['W', 'O', 'R', 'K', 'S'].map(c => ctx.measureText(c).width);
      const totalFinal  = finalWidths.reduce((a, b) => a + b, 0);
      const charGap     = (blockW - totalFinal) / 4;
      const worksXs: number[] = [];
      let wx = vxLeft;
      finalWidths.forEach((w, i) => {
        worksXs.push(wx);
        wx += w + (i < 4 ? charGap : 0);
      });

      const padX   = vxSize * 0.22;
      const padTop = vxSize * 0.18;
      const padBot = worksCap * 0.55;
      const callX  = vxLeft - padX;
      const callY  = blockTop - padTop;
      const callW  = blockW + padX * 2;
      const callH  = (worksY + padBot) - callY;
      const callCY = callY + callH / 2;

      return {
        sqSize, sqX, sqY, blockW, cx, cy,
        vxSize, worksSize, vxY, worksY,
        vxLeft, xLeft, worksXs,
        callX, callY, callW, callH, callCY,
        zoneMargin: sqSize * 0.10,
        armLen:     sqSize * 0.18,
      };
    }

    const ro = new ResizeObserver(() => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      fixedLayout   = null;
    });
    ro.observe(canvas);
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    function spawnGlitch(cx: number, cy: number, W: number, H: number) {
      let x = 0, y = 0, tries = 0;
      do {
        x = 24 + Math.random() * (W - 48);
        y = 24 + Math.random() * (H - 48);
        tries++;
      } while (Math.hypot(x - cx, y - cy) < 170 && tries < 30);

      const roll = Math.random();
      const kind: GlitchKind = roll < 0.45 ? 'char' : roll < 0.65 ? 'rect' : roll < 0.82 ? 'triangle' : 'diamond';
      glitchPts.push({
        x, y, kind, char: randChar(),
        size:    kind === 'char' ? 9 + Math.random() * 9 : 14 + Math.random() * 14,
        opacity: 0,
        maxLife: 0.25 + Math.random() * 0.45,
        life:    0,
        rot:     Math.random() * Math.PI * 2,
      });
    }

    function drawGlitchPt(p: GlitchPt) {
      const alpha = p.opacity * 0.26;
      ctx.save();
      ctx.translate(p.x, p.y);

      if (p.kind === 'char') {
        ctx.rotate(p.rot * 0.12);
        ctx.fillStyle    = `rgba(0,0,0,${alpha})`;
        ctx.font         = `400 ${p.size}px 'JetBrains Mono', monospace`;
        ctx.textBaseline = 'middle';
        ctx.textAlign    = 'center';
        ctx.fillText(p.char, 0, 0);
      } else {
        ctx.rotate(p.rot);
        ctx.fillStyle = `rgba(0,0,0,${alpha * 0.9})`;
        ctx.setLineDash([]);
        const s = p.size;
        ctx.beginPath();
        switch (p.kind) {
          case 'rect':
            ctx.rect(-s / 2, -s / 2, s, s);
            break;
          case 'triangle':
            ctx.moveTo(0,      -s * 0.577);
            ctx.lineTo( s / 2,  s * 0.289);
            ctx.lineTo(-s / 2,  s * 0.289);
            ctx.closePath();
            break;
          case 'diamond':
            ctx.moveTo(0,      -s / 2);
            ctx.lineTo( s / 2,  0);
            ctx.lineTo(0,       s / 2);
            ctx.lineTo(-s / 2,  0);
            ctx.closePath();
            break;
        }
        ctx.fill();
      }
      ctx.restore();
    }

    function draw(ts: number) {
      if (!startTs) startTs = ts;
      const elapsed = (ts - startTs) / 1000;
      const dt      = prevTs ? (ts - prevTs) / 1000 : 0;
      prevTs        = ts;

      const W = canvas.width;
      const H = canvas.height;
      if (W === 0 || H === 0) { animId = requestAnimationFrame(draw); return; }

      if (!fixedLayout) fixedLayout = computeFixed(W, H);
      const L = fixedLayout;
      const { sqX, sqY, sqSize, cx, cy, callX, callY, callW, callH, callCY } = L;

      ctx.clearRect(0, 0, W, H);

      // 1. Outer square
      const outerP = easeOut(prog(elapsed, 0, T_OUTER_END));
      if (outerP > 0) {
        ctx.save();
        ctx.strokeStyle = `rgba(0,0,0,${0.10 * outerP})`;
        ctx.lineWidth   = 0.7;
        ctx.setLineDash([]);
        ctx.strokeRect(sqX, sqY, sqSize, sqSize);
        ctx.restore();
      }

      // 2. Zone corner brackets
      const cornerP = easeOut(prog(elapsed, T_CORNER_START, T_CORNER_END));
      if (cornerP > 0) {
        const arm = L.armLen * cornerP;
        const m   = L.zoneMargin;
        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.lineWidth   = 0.7;
        ctx.setLineDash([]);

        const drawZoneCorner = (ox: number, oy: number, dx: number, dy: number) => {
          ctx.beginPath();
          ctx.moveTo(ox, oy); ctx.lineTo(ox + dx * arm, oy);
          ctx.moveTo(ox, oy); ctx.lineTo(ox, oy + dy * arm);
          ctx.stroke();
        };

        drawZoneCorner(sqX + m,          sqY + m,           1,  1);
        drawZoneCorner(sqX + sqSize - m, sqY + m,          -1,  1);
        drawZoneCorner(sqX + m,          sqY + sqSize - m,   1, -1);
        drawZoneCorner(sqX + sqSize - m, sqY + sqSize - m,  -1, -1);
        ctx.restore();
      }

      // 3. Extension lines: from outer square edges inward to callout box
      const extP = easeOut(prog(elapsed, T_EXT_START, T_EXT_END));
      if (extP > 0) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,0,0.16)';
        ctx.lineWidth   = 0.55;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(sqX,          callCY); ctx.lineTo(sqX + (callX - sqX) * extP,                      callCY);
        ctx.moveTo(sqX + sqSize, callCY); ctx.lineTo(sqX + sqSize + (callX + callW - sqX - sqSize) * extP, callCY);
        ctx.moveTo(cx, sqY);          ctx.lineTo(cx, sqY + (callY - sqY) * extP);
        ctx.moveTo(cx, sqY + sqSize); ctx.lineTo(cx, sqY + sqSize + (callY + callH - sqY - sqSize) * extP);
        ctx.stroke();
        ctx.restore();
      }

      // Tick marks at outer-square endpoints
      if (extP >= 0.95) {
        const tickOp = Math.min(1, (elapsed - T_EXT_END) / 0.4) * 0.20;
        if (tickOp > 0) {
          const tl = 4;
          ctx.save();
          ctx.strokeStyle = `rgba(0,0,0,${tickOp})`;
          ctx.lineWidth   = 0.55;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(sqX,          callCY - tl); ctx.lineTo(sqX,          callCY + tl);
          ctx.moveTo(sqX + sqSize, callCY - tl); ctx.lineTo(sqX + sqSize, callCY + tl);
          ctx.moveTo(cx - tl, sqY);          ctx.lineTo(cx + tl, sqY);
          ctx.moveTo(cx - tl, sqY + sqSize); ctx.lineTo(cx + tl, sqY + sqSize);
          ctx.stroke();
          ctx.restore();
        }
      }

      // 4. Callout box sides grow from midpoints outward
      const callP = easeOut(prog(elapsed, T_CALL_START, T_CALL_END));
      if (callP > 0) {
        const halfW = callW / 2 * callP;
        const halfH = callH / 2 * callP;
        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.lineWidth   = 0.7;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(cx - halfW, callY);         ctx.lineTo(cx + halfW, callY);
        ctx.moveTo(cx - halfW, callY + callH); ctx.lineTo(cx + halfW, callY + callH);
        ctx.moveTo(callX, callCY - halfH);     ctx.lineTo(callX, callCY + halfH);
        ctx.moveTo(callX + callW, callCY - halfH); ctx.lineTo(callX + callW, callCY + halfH);
        ctx.stroke();
        ctx.restore();
      }

      // 5. Glitch particles
      if (elapsed > T_GLITCH_START) {
        if (ts - lastSpawn > 150 && glitchPts.length < 14) {
          spawnGlitch(cx, cy, W, H);
          lastSpawn = ts;
        }
        for (let i = glitchPts.length - 1; i >= 0; i--) {
          const p = glitchPts[i];
          p.life += dt;
          const t = p.life / p.maxLife;
          if (t >= 1) { glitchPts.splice(i, 1); continue; }
          p.opacity = t < 0.2 ? t / 0.2 : t < 0.65 ? 1 : 1 - (t - 0.65) / 0.35;
          drawGlitchPt(p);
        }
      }

      // 6. Cipher → VX + WORKS
      if (elapsed >= T_CIPHER_START) {
        if (Math.random() < 0.4) {
          vxChars.forEach(ch => { if (!ch.locked) ch.display = randChar(); });
          worksChars.forEach(ch => { if (!ch.locked) ch.display = randChar(); });
        }
        vxChars.forEach(ch => {
          if (!ch.locked && elapsed >= LOCK_TIMES[ch.final]) { ch.display = ch.final; ch.locked = true; }
        });
        worksChars.forEach(ch => {
          if (!ch.locked && elapsed >= LOCK_TIMES[ch.final]) { ch.display = ch.final; ch.locked = true; }
        });

        const textOp = easeOut(prog(elapsed, T_CIPHER_START, T_CIPHER_START + 0.35));

        ctx.save();
        ctx.fillStyle    = `rgba(0,0,0,${textOp})`;
        ctx.font         = `700 ${L.vxSize}px 'Space Grotesk', system-ui, sans-serif`;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(vxChars[0].display, L.vxLeft, L.vxY);
        ctx.fillText(vxChars[1].display, L.xLeft,  L.vxY);
        ctx.restore();

        ctx.save();
        ctx.fillStyle    = `rgba(0,0,0,${textOp})`;
        ctx.font         = `500 ${L.worksSize}px 'Space Grotesk', system-ui, sans-serif`;
        ctx.textBaseline = 'alphabetic';
        worksChars.forEach((ch, i) => {
          ctx.fillText(ch.display, L.worksXs[i], L.worksY);
        });
        ctx.restore();
      }

      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, [bare]);

  // Splash timing — in dev, always show; in production skip on repeat visits
  useEffect(() => {
    if (bare) return;
    const isDev = process.env.NODE_ENV !== 'production';
    const SKIP_KEY = 'vx:bp';

    const SCROLL_KEYS = new Set(['Space','PageUp','PageDown','End','Home','ArrowUp','ArrowDown']);
    const blockWheel = (e: Event) => e.preventDefault();
    const blockKeys  = (e: KeyboardEvent) => { if (SCROLL_KEYS.has(e.code)) e.preventDefault(); };

    function lockScroll()   {
      window.addEventListener('wheel',     blockWheel, { passive: false });
      window.addEventListener('touchmove', blockWheel, { passive: false });
      window.addEventListener('keydown',   blockKeys);
    }
    function unlockScroll() {
      window.removeEventListener('wheel',     blockWheel);
      window.removeEventListener('touchmove', blockWheel);
      window.removeEventListener('keydown',   blockKeys);
    }

    lockScroll();

    if (!isDev && sessionStorage.getItem(SKIP_KEY)) {
      unlockScroll();
      setPhase('done');
      markDone();
      return;
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      unlockScroll();
      setPhase('done');
      markDone();
      if (!isDev) sessionStorage.setItem(SKIP_KEY, '1');
      return;
    }

    const t1 = setTimeout(() => setPhase('curtain'), CURTAIN_DELAY);
    const t2 = setTimeout(() => {
      window.scrollTo(0, 0);
      unlockScroll();
      setPhase('done');
      markDone();
      if (!isDev) sessionStorage.setItem(SKIP_KEY, '1');
    }, CURTAIN_DELAY + CURTAIN_DUR + 80);

    return () => { clearTimeout(t1); clearTimeout(t2); unlockScroll(); };
  }, [bare, markDone]);

  if (bare || phase === 'done') return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position:      'fixed',
        inset:          0,
        zIndex:         200,
        background:    '#ffffff',
        pointerEvents: phase === 'curtain' ? 'none' : 'all',
        transform:     phase === 'curtain' ? 'translateY(-100%)' : 'translateY(0)',
        transition:    phase === 'curtain'
          ? `transform ${CURTAIN_DUR}ms cubic-bezier(0.76, 0, 0.24, 1)`
          : 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
    </div>
  );
}
