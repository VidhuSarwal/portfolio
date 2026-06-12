'use client';

import { useEffect, useRef } from 'react';

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789─│┤├┬┴·▪';
function randChar() { return CHARSET[Math.floor(Math.random() * CHARSET.length)]; }

// ── Timeline ──────────────────────────────────────────────────────────────────
const T_OUTER_END    = 0.7;
const T_CORNER_START = 0.2;
const T_CORNER_END   = 0.9;
const T_EXT_START    = 0.6;
const T_EXT_END      = 1.5;
const T_CALL_START   = 0.9;
const T_CALL_END     = 1.5;
const T_CIPHER_START = 0.4;
const T_GLITCH_START = 0.5;
const T_SETTLE       = 3.6;

const LOCK_TIMES: Record<string, number> = {
  V: 2.3, X: 2.7, W: 2.9, O: 3.0, R: 3.1, K: 3.15, S: 3.2,
};

function prog(t: number, s: number, e: number) {
  return Math.max(0, Math.min(1, (t - s) / (e - s)));
}
function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }

// ── Glitch particles ──────────────────────────────────────────────────────────
type GlitchKind = 'char' | 'rect' | 'triangle' | 'diamond';
interface GlitchPt {
  x: number; y: number; kind: GlitchKind; char: string;
  size: number; opacity: number; maxLife: number; life: number; rot: number;
}

interface Props { logoScale?: number; ringsScale?: number; glitch?: boolean; }

export default function V4Blueprint({ logoScale = 0.90, glitch = true }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const logoScaleRef = useRef(logoScale);
  const glitchRef    = useRef(glitch);
  useEffect(() => { logoScaleRef.current = logoScale; }, [logoScale]);
  useEffect(() => { glitchRef.current    = glitch;    }, [glitch]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;

    let startTs = 0, prevTs = 0, animId = 0, lastSpawn = 0;

    const glitchPts: GlitchPt[] = [];
    const vxChars    = ['V', 'X'].map(c => ({ final: c, display: randChar(), locked: false }));
    const worksChars = ['W', 'O', 'R', 'K', 'S'].map(c => ({ final: c, display: randChar(), locked: false }));

    // Fixed layout positions computed once per canvas size (based on FINAL chars for stability)
    let fixedLayout: {
      sqSize: number; sqX: number; sqY: number;
      blockW: number; cx: number; cy: number;
      vxSize: number; worksSize: number;
      vxY: number; worksY: number;
      vxLeft: number; xLeft: number;
      // WORKS: fixed x positions for each char based on final char widths
      worksXs: number[];
      // Callout box
      callX: number; callY: number; callW: number; callH: number; callCY: number;
      // Corner bracket zone
      zoneMargin: number; armLen: number;
    } | null = null;

    function computeFixed(W: number, H: number) {
      const cx = W / 2;
      const cy = H / 2;
      const sqSize = Math.min(W, H) * 0.72;
      const sqX    = cx - sqSize / 2;
      const sqY    = cy - sqSize / 2;
      const ls     = logoScaleRef.current;

      const vxSize    = Math.min(sqSize * 0.20, 96) * ls;
      const worksSize = vxSize * 0.155;

      // Measure VX — use actualBoundingBoxAscent for exact cap height
      ctx.font = `700 ${vxSize}px 'Space Grotesk', system-ui, sans-serif`;
      const vMet  = ctx.measureText('V');
      const xMet  = ctx.measureText('X');
      const vW    = vMet.width;
      const xW    = xMet.width;
      const vxCap = vMet.actualBoundingBoxAscent; // true cap height in px

      const vxGap  = vxSize * 0.08;
      const blockW = vW + vxGap + xW;
      const vxLeft = cx - blockW / 2;
      const xLeft  = cx + blockW / 2 - xW;

      // Measure WORKS cap height
      ctx.font = `500 ${worksSize}px 'Space Grotesk', system-ui, sans-serif`;
      const worksCap = ctx.measureText('W').actualBoundingBoxAscent;

      // Vertical: center the cap-top→baseline block precisely at cy
      const rowGap   = vxSize * 0.10;
      const totalH   = vxCap + rowGap + worksCap;
      const blockTop = cy - totalH / 2;
      const vxY      = blockTop + vxCap;          // alphabetic baseline of VX
      const worksY   = vxY + rowGap + worksCap;   // alphabetic baseline of WORKS

      // WORKS: distribute final char widths to span exactly blockW
      const finalWidths = ['W', 'O', 'R', 'K', 'S'].map(c => ctx.measureText(c).width);
      const totalFinal  = finalWidths.reduce((a, b) => a + b, 0);
      const charGap     = (blockW - totalFinal) / 4;
      const worksXs: number[] = [];
      let wx = vxLeft;
      finalWidths.forEach((w, i) => {
        worksXs.push(wx);
        wx += w + (i < 4 ? charGap : 0);
      });

      // Callout box: tight around the measured block
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
        vxLeft, xLeft,
        worksXs,
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
            ctx.moveTo(0,     -s * 0.577);
            ctx.lineTo( s / 2, s * 0.289);
            ctx.lineTo(-s / 2, s * 0.289);
            ctx.closePath();
            break;
          case 'diamond':
            ctx.moveTo(0,     -s / 2);
            ctx.lineTo(s / 2,  0);
            ctx.lineTo(0,      s / 2);
            ctx.lineTo(-s / 2, 0);
            ctx.closePath();
            break;
        }
        ctx.fill(); // solid black fill
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

      // ── 1. Outer square border ─────────────────────────────────────────
      const outerP = easeOut(prog(elapsed, 0, T_OUTER_END));
      if (outerP > 0) {
        ctx.save();
        ctx.strokeStyle = `rgba(0,0,0,${0.10 * outerP})`;
        ctx.lineWidth   = 0.7;
        ctx.setLineDash([]);
        ctx.strokeRect(sqX, sqY, sqSize, sqSize);
        ctx.restore();
      }

      // ── 2. Zone corner brackets (first-iteration style) ────────────────
      //    4 L-shaped brackets near corners of the outer square
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

      // ── 3. Extension lines: FROM outer square edges INWARD to callout box
      const extP = easeOut(prog(elapsed, T_EXT_START, T_EXT_END));
      if (extP > 0) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,0,0.16)';
        ctx.lineWidth   = 0.55;
        ctx.setLineDash([]);

        // Horizontal left: sqX → callX
        ctx.beginPath();
        ctx.moveTo(sqX, callCY);
        ctx.lineTo(sqX + (callX - sqX) * extP, callCY);
        // Horizontal right: sqX+sqSize → callX+callW
        ctx.moveTo(sqX + sqSize, callCY);
        ctx.lineTo(sqX + sqSize + (callX + callW - sqX - sqSize) * extP, callCY);
        ctx.stroke();

        // Vertical top: sqY → callY
        ctx.beginPath();
        ctx.moveTo(cx, sqY);
        ctx.lineTo(cx, sqY + (callY - sqY) * extP);
        // Vertical bottom: sqY+sqSize → callY+callH
        ctx.moveTo(cx, sqY + sqSize);
        ctx.lineTo(cx, sqY + sqSize + (callY + callH - sqY - sqSize) * extP);
        ctx.stroke();

        ctx.restore();
      }

      // Tick marks at outer-square endpoints of extension lines
      if (extP >= 0.95) {
        const tickOp = Math.min(1, (elapsed - T_EXT_END) / 0.4) * 0.20;
        if (tickOp > 0) {
          const tl = 4;
          ctx.save();
          ctx.strokeStyle = `rgba(0,0,0,${tickOp})`;
          ctx.lineWidth   = 0.55;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(sqX, callCY - tl); ctx.lineTo(sqX, callCY + tl);
          ctx.moveTo(sqX + sqSize, callCY - tl); ctx.lineTo(sqX + sqSize, callCY + tl);
          ctx.moveTo(cx - tl, sqY); ctx.lineTo(cx + tl, sqY);
          ctx.moveTo(cx - tl, sqY + sqSize); ctx.lineTo(cx + tl, sqY + sqSize);
          ctx.stroke();
          ctx.restore();
        }
      }

      // ── 4. Callout box: 4 sides grow from their midpoints outward ─────
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

      // ── 5. Glitch particles ────────────────────────────────────────────
      if (glitchRef.current && elapsed > T_GLITCH_START) {
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

      // ── 6. Cipher: VX + WORKS scramble → lock ─────────────────────────
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

        // VX — V pinned to blockW left, X pinned to blockW right
        ctx.save();
        ctx.fillStyle    = `rgba(0,0,0,${textOp})`;
        ctx.font         = `700 ${L.vxSize}px 'Space Grotesk', system-ui, sans-serif`;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(vxChars[0].display, L.vxLeft, L.vxY);
        ctx.fillText(vxChars[1].display, L.xLeft, L.vxY);
        ctx.restore();

        // WORKS — chars at pre-computed fixed positions spanning blockW
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
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#fff' }}>
      <canvas ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </div>
  );
}
