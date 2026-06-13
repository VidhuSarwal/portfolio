'use client';

import { useEffect, useRef, useState } from 'react';

// ── Constants ─────────────────────────────────────────────────────────────────
const BEAM_FULL = 26;     // normal beam length (px)
const BEAM_SPD  = 2.1;    // ball speed (px / frame at 60 fps)
const RAIL_HALF = 34;     // half-height of each endpoint rail
const RAIL_W    = 3;
const RAIL_PAD  = 36;     // distance from frame inner edge to rail center-x
const AI_K      = 0.058;  // spring constant — AI rail tracking
const AI_D      = 0.80;
const USR_K     = 0.14;   // spring constant — user rail tracking
const USR_D     = 0.78;
const IDLE_MS   = 2000;   // ms before AI resumes after mouse leaves
const FP        = 16;     // inner frame inset from canvas edge
const OF        = 6;      // outer frame inset from canvas edge (double-border gap = FP - OF)
const CL        = 16;     // outer corner bracket arm length
const ECHO_N    = 7;      // echo trail depth
const BEAM_K    = 0.16;   // elastic spring rate for beam length

// 7 routing-node positions as fractions of the playfield [0,1] × [0,1]
// Intentionally asymmetric — keep them away from centerline and rail x positions
const NODE_FRACS: [number, number][] = [
  [0.22, 0.16], [0.70, 0.12], [0.42, 0.44],
  [0.26, 0.72], [0.74, 0.63], [0.55, 0.86], [0.35, 0.30],
];

// Background line fragments — [x1f, y1f, x2f, y2f] as fractions of (fw, fh)
const BG_LINES: [number, number, number, number][] = [
  [0.15, 0.22, 0.38, 0.22],
  [0.60, 0.40, 0.82, 0.40],
  [0.18, 0.70, 0.46, 0.70],
  [0.54, 0.80, 0.78, 0.80],
];

const STATUSES = ['PACKET ROUTING', 'SIGNAL ACTIVE', 'LINK ESTABLISHED', 'SYSTEM READY'] as const;

// ── Physics helpers ───────────────────────────────────────────────────────────
function springStep(p: number, v: number, t: number, k: number, d: number): [number, number] {
  const f = k * (t - p), nv = v * d + f;
  return [p + nv, nv];
}

// ── Audio ─────────────────────────────────────────────────────────────────────
function playBlip(ac: AudioContext, freq: number, gain: number, dur: number) {
  try {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0, ac.currentTime);
    g.gain.linearRampToValueAtTime(gain, ac.currentTime + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    o.start(); o.stop(ac.currentTime + dur + 0.01);
  } catch { /* ignore */ }
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Echo { bx: number; by: number; nx: number; ny: number; len: number; }
interface Ring { x: number; y: number; r: number; alpha: number; act: boolean; }
interface Node { x: number; y: number; glow: number; }

const mkRing = (): Ring => ({ x: 0, y: 0, r: 0, alpha: 0, act: false });

// ── Component ─────────────────────────────────────────────────────────────────
export default function SignalPong() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const muteRef    = useRef(true);
  const audioRef   = useRef<AudioContext | null>(null);
  const allowAudio = useRef(false);
  const [muted, setMuted] = useState(true);

  function initAudio() {
    allowAudio.current = true;
    if (!audioRef.current) { try { audioRef.current = new AudioContext(); } catch { return; } }
    if (audioRef.current.state === 'suspended') audioRef.current.resume().catch(() => {});
  }
  function handleMuteToggle() {
    const next = !muteRef.current;
    muteRef.current = next; setMuted(next);
    if (!next) initAudio();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Geometry ──────────────────────────────────────────────────────────
    let W = 0, H = 0;
    let fx = 0, fy = 0, fw = 0, fh = 0;
    let lrx = 0, rrx = 0;

    // ── Sim state ─────────────────────────────────────────────────────────
    let bx = 0, by = 0, bvx = 0, bvy = 0;
    let beamLen = BEAM_FULL;               // elastic beam length
    let ly = 0, lvy = 0;
    let ry = 0, rvy = 0;
    let lFlash = 0, rFlash = 0, tFlash = 0, bFlash = 0;
    let mouseY = 0, userCtrl = false, lastMouse = -Infinity;
    let hbPulse = 0, hops = 0;
    let statusIdx = 0;
    let spinePulseY = 0;                   // spine traveling dot y

    // Pulse rings (lower alpha now — nodes are the impact vocabulary)
    let lRing = mkRing(), rRing = mkRing();
    let tRing = mkRing(), bRing = mkRing();

    // Echo trail ring buffer
    const echoBuf: Echo[] = Array.from({ length: ECHO_N }, () => ({ bx: 0, by: 0, nx: 1, ny: 0, len: 0 }));
    let echoHead = 0, echoCount = 0;

    // Routing nodes (absolute px, computed after first resize)
    let nodes: Node[] = [];

    function initState() {
      const cy = fy + fh / 2;
      bx = fx + fw / 2; by = cy;
      const ang = -Math.PI / 5;
      bvx = BEAM_SPD * Math.cos(ang); bvy = BEAM_SPD * Math.sin(ang);
      beamLen = BEAM_FULL;
      ly = cy; lvy = 0; ry = cy; rvy = 0; mouseY = cy;
      spinePulseY = fy;
      // Build routing nodes within playfield (avoid spine ±30 and rails ±20)
      nodes = NODE_FRACS.map(([rx, ry]) => ({
        x: lrx + rx * (rrx - lrx),
        y: fy + ry * fh,
        glow: 0,
      }));
    }

    // ── ResizeObserver ────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      W = canvas!.offsetWidth; H = canvas!.offsetHeight;
      if (W === 0 || H === 0) return;
      canvas!.width = W * dpr; canvas!.height = H * dpr;
      const ctx = canvas!.getContext('2d'); if (!ctx) return;
      ctx.scale(dpr, dpr);
      fx = FP; fy = FP; fw = W - FP * 2; fh = H - FP * 2;
      lrx = fx + RAIL_PAD; rrx = fx + fw - RAIL_PAD;
      initState();
    });
    ro.observe(canvas);

    // ── Mouse ─────────────────────────────────────────────────────────────
    function onMove(e: MouseEvent) {
      const r = canvas!.getBoundingClientRect();
      mouseY = Math.max(fy + RAIL_HALF, Math.min(fy + fh - RAIL_HALF, e.clientY - r.top));
      lastMouse = performance.now();
      if (e.clientX - r.left > fx + fw * 0.5) userCtrl = true;
    }
    function onLeave() { userCtrl = false; }
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);

    // ── Status cycling ────────────────────────────────────────────────────
    const statusTimer = setInterval(() => {
      statusIdx = (statusIdx + 1) % STATUSES.length;
    }, 4200);

    // ── Theme helpers ─────────────────────────────────────────────────────
    const isLight = () => document.documentElement.getAttribute('data-theme') === 'light';
    const bgColor    = (a: number) => isLight() ? `rgba(248,246,241,${a})` : `rgba(8,8,8,${a})`;
    const lineColor  = (a: number) => isLight() ? `rgba(28,26,23,${a})`    : `rgba(244,244,242,${a})`;
    const accentColor= (a: number) => isLight() ? `rgba(44,82,130,${a})`   : `rgba(200,228,255,${a})`;

    // ── Speed clamp ───────────────────────────────────────────────────────
    function clampSpeed() {
      const s = Math.sqrt(bvx * bvx + bvy * bvy) || 1;
      if (Math.abs(s - BEAM_SPD) > 0.2) { bvx = bvx / s * BEAM_SPD; bvy = bvy / s * BEAM_SPD; }
    }

    // ── Trajectory prediction ─────────────────────────────────────────────
    function computeTraj(): Array<[number, number, number, number]> {
      const segs: Array<[number, number, number, number]> = [];
      let px = bx, py = by, pvx = bvx, pvy = bvy;
      let sx = px, sy = py;
      const top = fy + 1, bot = fy + fh - 1;
      for (let s = 0; s < 400 && segs.length < 6; s++) {
        px += pvx; py += pvy;
        if (py < top) { py = top; pvy = Math.abs(pvy); segs.push([sx, sy, px, py]); sx = px; sy = py; }
        else if (py > bot) { py = bot; pvy = -Math.abs(pvy); segs.push([sx, sy, px, py]); sx = px; sy = py; }
        if (px <= lrx) { segs.push([sx, sy, lrx, py]); break; }
        if (px >= rrx) { segs.push([sx, sy, rrx, py]); break; }
      }
      return segs;
    }

    // ── Audio ─────────────────────────────────────────────────────────────
    function tryBlip(freq: number, gain: number, dur: number) {
      if (muteRef.current || !allowAudio.current || !audioRef.current) return;
      playBlip(audioRef.current, freq, gain, dur);
    }

    // ── Draw loop ─────────────────────────────────────────────────────────
    let animId = 0, lastTs = 0;

    function draw(ts: number) {
      animId = requestAnimationFrame(draw);
      const dt = Math.min((ts - lastTs) / 16.67, 3);
      lastTs = ts;
      if (fw <= 0 || fh <= 0) return;
      const ctx = canvas!.getContext('2d'); if (!ctx) return;

      // ── Physics ───────────────────────────────────────────────────────────
      if (!reduced) {
        bx += bvx * dt; by += bvy * dt;

        // Elastic beam spring — recover toward full length each frame
        beamLen += (BEAM_FULL - beamLen) * BEAM_K * dt;

        // Spine pulse drift
        spinePulseY += 1.1 * dt;
        if (spinePulseY > fy + fh) spinePulseY = fy;

        // Top / bottom walls
        if (by < fy + 1) {
          by = fy + 1; bvy = Math.abs(bvy);
          beamLen = BEAM_FULL * 0.45;
          tFlash = 8; hbPulse = 1;
          tRing = { x: bx, y: fy, r: 0, alpha: 0.18, act: true };
          tryBlip(480, 0.020, 0.07);
        }
        if (by > fy + fh - 1) {
          by = fy + fh - 1; bvy = -Math.abs(bvy);
          beamLen = BEAM_FULL * 0.45;
          bFlash = 8; hbPulse = 1;
          bRing = { x: bx, y: fy + fh, r: 0, alpha: 0.18, act: true };
          tryBlip(480, 0.020, 0.07);
        }

        // Left rail
        if (bx <= lrx + RAIL_W) {
          bx = lrx + RAIL_W + 0.5; bvx = Math.abs(bvx);
          bvy += (Math.random() - 0.5) * 0.4;
          beamLen = BEAM_FULL * 0.45;
          lFlash = 14; hbPulse = 1; hops++;
          lRing = { x: lrx, y: by, r: 0, alpha: 0.25, act: true };
          tryBlip(880, 0.036, 0.065);
        }

        // Right rail
        if (bx >= rrx - RAIL_W) {
          bx = rrx - RAIL_W - 0.5; bvx = -Math.abs(bvx);
          bvy += (Math.random() - 0.5) * 0.4;
          beamLen = BEAM_FULL * 0.45;
          rFlash = 14; hbPulse = 1; hops++;
          rRing = { x: rrx, y: by, r: 0, alpha: 0.25, act: true };
          tryBlip(880, 0.036, 0.065);
        }

        clampSpeed();
        if (Math.abs(bvy) < 0.25) bvy += bvy >= 0 ? 0.3 : -0.3;

        // Rails — AI or user
        const leftTarget = bvx < 0 ? by : ly;
        [ly, lvy] = springStep(ly, lvy, leftTarget, AI_K, AI_D);
        ly = Math.max(fy + RAIL_HALF, Math.min(fy + fh - RAIL_HALF, ly));

        const isUser      = userCtrl && performance.now() - lastMouse < IDLE_MS;
        const rightTarget = isUser ? mouseY : (bvx > 0 ? by : ry);
        [ry, rvy] = springStep(ry, rvy, rightTarget, isUser ? USR_K : AI_K, isUser ? USR_D : AI_D);
        ry = Math.max(fy + RAIL_HALF, Math.min(fy + fh - RAIL_HALF, ry));

        // Decay flash counters
        if (lFlash > 0) lFlash--; if (rFlash > 0) rFlash--;
        if (tFlash > 0) tFlash--; if (bFlash > 0) bFlash--;
        if (hbPulse > 0) hbPulse = Math.max(0, hbPulse - 0.035 * dt);

        // Routing node glow — proximity to beam
        const spd = Math.sqrt(bvx * bvx + bvy * bvy) || 1;
        for (const node of nodes) {
          const d = Math.sqrt((bx - node.x) ** 2 + (by - node.y) ** 2);
          if (d < 52) node.glow = Math.max(node.glow, 1 - d / 52);
          node.glow *= 0.93;
        }

        // Echo ring buffer — push current beam state
        echoBuf[echoHead] = { bx, by, nx: bvx / spd, ny: bvy / spd, len: beamLen };
        echoHead = (echoHead + 1) % ECHO_N;
        if (echoCount < ECHO_N) echoCount++;
      }

      // ── Render ───────────────────────────────────────────────────────────

      // Trail fade — slightly higher alpha so explicit echoes do the work
      ctx.save();
      ctx.beginPath(); ctx.rect(fx + 1, fy + 1, fw - 2, fh - 2); ctx.clip();
      ctx.fillStyle = bgColor(0.92);
      ctx.fillRect(fx + 1, fy + 1, fw - 2, fh - 2);

      // Background line fragments — barely visible infrastructure
      ctx.strokeStyle = lineColor(0.05);
      ctx.lineWidth = 1;
      for (const [x1f, y1f, x2f, y2f] of BG_LINES) {
        ctx.beginPath();
        ctx.moveTo(fx + x1f * fw, fy + y1f * fh);
        ctx.lineTo(fx + x2f * fw, fy + y2f * fh);
        ctx.stroke();
      }

      // Trajectory prediction — dashed accent, extremely faint
      if (!reduced) {
        ctx.strokeStyle = accentColor(0.11);
        ctx.lineWidth = 1; ctx.setLineDash([3, 7]);
        for (const [x1, y1, x2, y2] of computeTraj()) {
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      // Spine — tiny dots with traveling pulse
      const spineX = fx + fw / 2;
      const dotStep = 14;
      for (let dy = fy + 10; dy <= fy + fh - 10; dy += dotStep) {
        const nearPulse = Math.abs(dy - spinePulseY) < dotStep * 0.85;
        ctx.fillStyle = lineColor(nearPulse ? 0.28 : 0.07);
        ctx.beginPath();
        ctx.arc(spineX, dy, nearPulse ? 2.0 : 1.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Routing nodes — glow on proximity
      for (const node of nodes) {
        ctx.fillStyle = accentColor(0.07 + node.glow * 0.50);
        ctx.beginPath(); ctx.arc(node.x, node.y, 1.5, 0, Math.PI * 2); ctx.fill();
        // Outer ring when glowing
        if (node.glow > 0.08) {
          ctx.strokeStyle = accentColor(node.glow * 0.22);
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(node.x, node.y, 4 + node.glow * 5, 0, Math.PI * 2); ctx.stroke();
        }
      }

      // Single-frame beam→node connection line on closest approach
      if (!reduced) {
        let closest: Node | null = null, closestD = Infinity;
        for (const node of nodes) {
          const d = Math.sqrt((bx - node.x) ** 2 + (by - node.y) ** 2);
          if (d < 28 && d < closestD) { closestD = d; closest = node; }
        }
        if (closest) {
          ctx.strokeStyle = accentColor(0.18);
          ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(closest.x, closest.y); ctx.stroke();
        }
      }

      // Pulse rings — muted; node activation is the primary impact vocabulary
      for (const [ring, useAccent] of [[lRing, true], [rRing, true], [tRing, false], [bRing, false]] as [Ring, boolean][]) {
        if (!ring.act) continue;
        ring.r += 1.2 * dt; ring.alpha = Math.max(0, ring.alpha - 0.032 * dt);
        if (ring.alpha <= 0) { ring.act = false; continue; }
        ctx.strokeStyle = useAccent ? accentColor(ring.alpha) : lineColor(ring.alpha);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2); ctx.stroke();
      }

      // Echo trail — draw oldest first (lowest alpha), newest last
      if (!reduced && echoCount > 0) {
        for (let i = echoCount - 1; i >= 0; i--) {
          const idx = (echoHead - 1 - i + ECHO_N) % ECHO_N;
          const e   = echoBuf[idx];
          // i=0 newest (highest alpha), i=echoCount-1 oldest (lowest)
          const a   = (1 - i / echoCount) * 0.18;
          const hl  = e.len / 2;
          ctx.strokeStyle = accentColor(a);
          ctx.lineWidth = 2.0; ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(e.bx - e.nx * hl, e.by - e.ny * hl);
          ctx.lineTo(e.bx + e.nx * hl, e.by + e.ny * hl);
          ctx.stroke();
        }
      }

      // Left endpoint rail
      const la = lFlash > 0 ? 0.3 + (lFlash / 14) * 0.55 : 0.28;
      ctx.strokeStyle = lineColor(la); ctx.lineWidth = RAIL_W; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(lrx, ly - RAIL_HALF); ctx.lineTo(lrx, ly + RAIL_HALF); ctx.stroke();
      for (const y of [ly - RAIL_HALF, ly + RAIL_HALF]) {
        ctx.fillStyle = lineColor(la);
        ctx.beginPath(); ctx.arc(lrx, y, 2.5, 0, Math.PI * 2); ctx.fill();
      }

      // Right endpoint rail
      const ra = rFlash > 0 ? 0.3 + (rFlash / 14) * 0.55 : 0.28;
      ctx.strokeStyle = lineColor(ra); ctx.lineWidth = RAIL_W;
      ctx.beginPath(); ctx.moveTo(rrx, ry - RAIL_HALF); ctx.lineTo(rrx, ry + RAIL_HALF); ctx.stroke();
      for (const y of [ry - RAIL_HALF, ry + RAIL_HALF]) {
        ctx.fillStyle = lineColor(ra);
        ctx.beginPath(); ctx.arc(rrx, y, 2.5, 0, Math.PI * 2); ctx.fill();
      }

      // Signal beam — elastic, no center dot, accent color
      if (!reduced) {
        const spd2 = Math.sqrt(bvx * bvx + bvy * bvy) || 1;
        const nx   = bvx / spd2, ny = bvy / spd2;
        const hl   = beamLen / 2;
        ctx.strokeStyle = accentColor(0.78); ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bx - nx * hl, by - ny * hl);
        ctx.lineTo(bx + nx * hl, by + ny * hl);
        ctx.stroke();
      }

      ctx.restore();

      // ── Frame overlays (outside clip — crisp edges) ───────────────────────

      // Measurement ticks along top/bottom inner frame edges
      ctx.strokeStyle = lineColor(0.09); ctx.lineWidth = 1;
      const tickStep = 24;
      for (let tx = lrx; tx <= rrx; tx += tickStep) {
        const major = (Math.round(tx - lrx) % (tickStep * 4)) < 2;
        const th    = major ? 6 : 3;
        ctx.beginPath(); ctx.moveTo(tx, fy + 1);      ctx.lineTo(tx, fy + 1 + th);      ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tx, fy + fh - 1); ctx.lineTo(tx, fy + fh - 1 - th); ctx.stroke();
      }

      // Inner frame border — bounds the playfield content
      ctx.strokeStyle = lineColor(0.14); ctx.lineWidth = 1;
      ctx.strokeRect(fx + 0.5, fy + 0.5, fw - 1, fh - 1);

      // Outer frame border — the decorative channel around the inner border
      const ox = OF + 0.5, oy = OF + 0.5, ow = W - OF * 2 - 1, oh = H - OF * 2 - 1;
      ctx.strokeStyle = lineColor(0.09); ctx.lineWidth = 1;
      ctx.strokeRect(ox, oy, ow, oh);

      // Corner brackets on outer frame — visual anchors of the overall frame
      ctx.strokeStyle = lineColor(0.22); ctx.lineWidth = 1;
      const oLeft = OF, oTop = OF, oRight = OF + ow, oBot = OF + oh;
      for (const [x, y, sx, sy] of [
        [oLeft,  oTop, 1,  1],
        [oRight, oTop, -1, 1],
        [oLeft,  oBot, 1, -1],
        [oRight, oBot, -1,-1],
      ] as [number,number,number,number][]) {
        ctx.beginPath(); ctx.moveTo(x + sx * CL, y); ctx.lineTo(x, y); ctx.lineTo(x, y + sy * CL); ctx.stroke();
      }

      // Status label — top-left
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = lineColor(0.20);
      ctx.fillText(STATUSES[statusIdx], fx + 18, fy + 18);

      // Telemetry — top-right (VEC / VEL / HOP)
      if (!reduced) {
        const angle = ((Math.atan2(bvy, bvx) * 180 / Math.PI) % 360 + 360) % 360;
        const lines = [
          `VEC  ${angle.toFixed(1).padStart(5)}°`,
          `VEL  ${BEAM_SPD.toFixed(1)}`,
          `HOP  ${String(hops).padStart(4, '0')}`,
        ];
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = lineColor(0.20);
        for (let i = 0; i < lines.length; i++) {
          const tw = ctx.measureText(lines[i]).width;
          ctx.fillText(lines[i], fx + fw - 18 - tw, fy + 18 + i * 13);
        }
      }

      // Heartbeat dot — bottom-right
      ctx.fillStyle = lineColor(0.12 + hbPulse * 0.46);
      ctx.beginPath(); ctx.arc(fx + fw - 18, fy + fh - 16, 2.5, 0, Math.PI * 2); ctx.fill();

      // Wall flash indicators
      if (tFlash > 0) {
        ctx.strokeStyle = lineColor((tFlash / 8) * 0.25); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(fx + 2, fy); ctx.lineTo(fx + fw - 2, fy); ctx.stroke();
      }
      if (bFlash > 0) {
        ctx.strokeStyle = lineColor((bFlash / 8) * 0.25); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(fx + 2, fy + fh); ctx.lineTo(fx + fw - 2, fy + fh); ctx.stroke();
      }
    }

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId); ro.disconnect();
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
      clearInterval(statusTimer);
      if (audioRef.current) { audioRef.current.close().catch(() => {}); audioRef.current = null; }
      allowAudio.current = false;
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
        aria-hidden="true"
      />
      <button
        onClick={handleMuteToggle}
        aria-label={muted ? 'Enable signal audio' : 'Disable signal audio'}
        style={{
          position: 'absolute', bottom: '22px', right: '22px',
          background: 'none', border: '1px solid var(--border-rest)', borderRadius: '2px',
          padding: '5px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center',
          gap: '5px', color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-jetbrains), monospace', fontSize: '9px',
          letterSpacing: '0.14em', textTransform: 'uppercase',
          transition: 'color 0.2s, border-color 0.2s', lineHeight: 1,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.borderColor = 'var(--border-rest)'; }}
      >
        <span style={{ fontSize: '11px', lineHeight: 1 }}>{muted ? '—' : '◉'}</span>
        <span>{muted ? 'SND OFF' : 'SND ON'}</span>
      </button>
    </div>
  );
}
