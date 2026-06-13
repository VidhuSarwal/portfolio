'use client';

import { useEffect, useRef, useState } from 'react';
import { siteConfig } from '@/lib/config';
import { projects } from '@/lib/projects';
import type { Project } from '@/lib/projects';

// ── Canvas color helpers (canvas ctx only — no CSS vars) ──────────────────────
const W = (a: number) => `rgba(255,255,255,${a})`;
const B = (a: number) => `rgba(200,228,255,${a})`;

// ── Per-project extended metadata ─────────────────────────────────────────────
const EXTRA = [
  {
    id: 'gsoc',
    primaryCta: 'FINAL REPORT',
    primaryHref: 'https://gist.github.com/VidhuSarwal/8e8d9dd93fea9075428cc6320c3b0a4f' as string | null,
    secondaryCta: 'GITHUB' as string | null,
    secondaryHref: null as string | null,
  },
  {
    id: 'samsung',
    primaryCta: 'CASE STUDY',
    primaryHref: null as string | null,
    secondaryCta: null as string | null,
    secondaryHref: null as string | null,
  },
  {
    id: 'vaultcrypt',
    primaryCta: 'GITHUB',
    primaryHref: null as string | null,
    secondaryCta: 'CASE STUDY' as string | null,
    secondaryHref: null as string | null,
  },
  {
    id: 'gitscope',
    primaryCta: 'GITHUB',
    primaryHref: null as string | null,
    secondaryCta: 'README' as string | null,
    secondaryHref: null as string | null,
  },
  {
    id: 'sih',
    primaryCta: 'CASE STUDY',
    primaryHref: null as string | null,
    secondaryCta: 'CERTIFICATE' as string | null,
    secondaryHref: null as string | null,
  },
] as const;

type ExtraEntry = (typeof EXTRA)[number];

// ═════════════════════════════════════════════════════════════════════════════
// Canvas visualizations — one per project, all drawn on same canvas
// ═════════════════════════════════════════════════════════════════════════════

// ── Viz 0: GSoC — Oscilloscope Hardware Validation ───────────────────────────
function drawGSOC(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const LX = 0.14 * w;   // trace start x
  const RX = 0.96 * w;   // trace end x
  const traceW = RX - LX;

  const channels = [
    { y: 0.16, label: 'I2C-0', freq: 11, duty: 0.45, type: 'sq'  },
    { y: 0.35, label: 'SPI-1', freq: 22, duty: 0.50, type: 'sq'  },
    { y: 0.54, label: 'UART',  freq: 7,  duty: 0.12, type: 'uart'},
    { y: 0.73, label: 'AIN',   freq: 5,  duty: 0.50, type: 'sin' },
  ];

  // Sweep cursor: repeats every 4 s
  const sweepCycle = 4.0;
  const sweepT     = (t / sweepCycle) % 1;
  const sweepX     = LX + sweepT * traceW;

  // Active detection channel rotates every 2 s
  const detCh = Math.floor((t / 2.0)) % channels.length;

  channels.forEach((ch, ci) => {
    const cy  = ch.y * h;
    const amp = h * 0.065;
    const on  = ci === detCh;

    // Baseline
    ctx.strokeStyle = W(0.05);
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(LX, cy);
    ctx.lineTo(RX, cy);
    ctx.stroke();

    // Channel label
    ctx.fillStyle = on ? W(0.35) : W(0.14);
    ctx.font      = '7px "JetBrains Mono",monospace';
    ctx.textAlign = 'right';
    ctx.fillText(ch.label, LX - 4, cy + 3);

    // Waveform trace — drawn up to sweep cursor
    ctx.strokeStyle = on ? B(0.75) : W(0.28);
    ctx.lineWidth   = on ? 1.5 : 1;
    ctx.beginPath();

    const steps = 320;
    let started = false;
    let prevHi: boolean | null = null;

    for (let s = 0; s <= steps; s++) {
      const px     = LX + (s / steps) * traceW;
      if (px > sweepX - 3) break;

      const pos    = s / steps;
      const phase  = ((pos * ch.freq) + t * 0.12) % 1;

      let yOff = 0;
      if (ch.type === 'sq') {
        const hi = phase < ch.duty;
        if (prevHi !== null && hi !== prevHi) {
          // Vertical edge
          ctx.lineTo(px, cy - (prevHi ? amp : -amp));
          ctx.lineTo(px, cy - (hi   ? amp : -amp));
        }
        yOff   = hi ? amp : -amp;
        prevHi = hi;
      } else if (ch.type === 'uart') {
        // Mostly high, bursts of bits
        const frame = (pos * ch.freq * 0.4 + t * 0.05) % 1;
        const hi    = frame > 0.25;
        if (prevHi !== null && hi !== prevHi) {
          ctx.lineTo(px, cy - (prevHi ? amp : -amp));
          ctx.lineTo(px, cy - (hi   ? amp : -amp));
        }
        yOff   = hi ? amp : -amp;
        prevHi = hi;
      } else {
        // Sine / analog
        yOff = amp * 0.85 * Math.sin(phase * Math.PI * 2);
      }

      if (!started) { ctx.moveTo(px, cy - yOff); started = true; }
      else          { ctx.lineTo(px, cy - yOff); }
    }
    ctx.stroke();

    // Detection spike on active channel — fixed position, visible once sweep passes
    const spikeX = LX + traceW * 0.62;
    if (on && sweepX > spikeX + 12) {
      ctx.strokeStyle = B(0.9);
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.moveTo(spikeX,     cy);
      ctx.lineTo(spikeX,     cy - amp * 2.2);
      ctx.lineTo(spikeX + 9, cy - amp * 2.2);
      ctx.lineTo(spikeX + 9, cy);
      ctx.stroke();
      ctx.fillStyle = B(0.12);
      ctx.fillRect(spikeX, cy - amp * 2.2, 9, amp * 2.2);
    }
  });

  // Sweep cursor
  ctx.strokeStyle = W(0.12);
  ctx.lineWidth   = 1;
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.moveTo(sweepX, 0.08 * h);
  ctx.lineTo(sweepX, 0.87 * h);
  ctx.stroke();
  ctx.setLineDash([]);

  // Status
  const devCount = 3 + (Math.floor(t * 0.3) % 5);
  ctx.fillStyle = W(0.16);
  ctx.font      = '7px "JetBrains Mono",monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`DETECT · ${devCount}/8 DEVICES`, LX, h * 0.93);
  ctx.fillStyle = B(0.42);
  ctx.textAlign = 'right';
  ctx.fillText('TRIGGER · AUTO', RX, h * 0.93);
}

// ── Viz 1: Samsung PRISM — 5-Stage Knowledge Pipeline ────────────────────────
function drawSamsung(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const stages = ['QUERY', 'RETRIEVE', 'PARSE', 'REASON', 'SYNTH'];
  const N      = stages.length;
  const sW     = 46, sH = 28, gap = 10;
  const totalW = N * sW + (N - 1) * gap;
  const ox     = (w - totalW) / 2;
  const pipeY  = h * 0.46;

  // Token travels through all stages: one full cycle = 6 s
  const tokCycle = 6.0;
  const tokT     = (t / tokCycle) % 1;
  const tokPos   = tokT * (N - 1);           // 0 → N-1
  const activeSt = Math.min(Math.floor(tokPos), N - 1);
  const segFrac  = tokPos - activeSt;        // 0-1 within current gap

  // Connector arrows between stages
  for (let i = 0; i < N - 1; i++) {
    const x1 = ox + i * (sW + gap) + sW;
    const x2 = x1 + gap;
    const lit = i === activeSt && segFrac > 0.2;
    ctx.strokeStyle = lit ? B(0.55) : W(0.08);
    ctx.lineWidth   = lit ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(x1, pipeY + sH / 2);
    ctx.lineTo(x2, pipeY + sH / 2);
    ctx.stroke();
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(x2 - 4, pipeY + sH / 2 - 3);
    ctx.lineTo(x2,     pipeY + sH / 2);
    ctx.lineTo(x2 - 4, pipeY + sH / 2 + 3);
    ctx.stroke();
  }

  // Stage blocks
  stages.forEach((label, i) => {
    const sx  = ox + i * (sW + gap);
    const lit = i === activeSt;

    ctx.strokeStyle = lit ? B(0.65) : W(0.12);
    ctx.lineWidth   = lit ? 1.5 : 1;
    ctx.strokeRect(sx, pipeY, sW, sH);
    if (lit) { ctx.fillStyle = B(0.07); ctx.fillRect(sx, pipeY, sW, sH); }

    ctx.fillStyle = lit ? B(0.70) : W(0.22);
    ctx.font      = `${lit ? 7 : 6}px "JetBrains Mono",monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(label, sx + sW / 2, pipeY + sH / 2 + 3);
  });

  // Moving token dot between stages
  {
    const tokX = ox + tokPos * (sW + gap) + sW / 2;
    ctx.fillStyle = B(0.85);
    ctx.beginPath();
    ctx.arc(tokX, pipeY + sH / 2, 3, 0, Math.PI * 2);
    ctx.fill();
    // Tail fade
    const gr = ctx.createLinearGradient(tokX - 20, 0, tokX, 0);
    gr.addColorStop(0, B(0));
    gr.addColorStop(1, B(0.18));
    ctx.fillStyle = gr;
    ctx.fillRect(tokX - 20, pipeY + sH / 2 - 1.5, 20, 3);
  }

  // Input fragments above pipeline
  for (let k = 0; k < 3; k++) {
    const fragX = ox + k * (sW + gap) * 0.7 + 6;
    const fragY = pipeY - 38 - k * 6;
    ctx.strokeStyle = W(0.07 + k * 0.02);
    ctx.lineWidth   = 1;
    ctx.strokeRect(fragX, fragY, 32, 18);
    ctx.fillStyle = W(0.12);
    ctx.font      = '5px "JetBrains Mono",monospace';
    ctx.textAlign = 'left';
    const labels2 = ['DOC', 'XLS', 'TXT'];
    ctx.fillText(labels2[k], fragX + 4, fragY + 12);
    // Drop line
    ctx.strokeStyle = W(0.05);
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(fragX + 16, fragY + 18);
    ctx.lineTo(ox + k * (sW + gap) * 0.7 + 16 + 6, pipeY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Output pulse below active stage
  const outX   = ox + activeSt * (sW + gap) + sW / 2;
  const outY   = pipeY + sH + 18;
  const opulse = 0.5 + 0.5 * Math.sin(t * 3.0);
  ctx.strokeStyle = B(0.18 + 0.14 * opulse);
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.arc(outX, outY, 5 + opulse * 3, 0, Math.PI * 2);
  ctx.stroke();

  // Status
  ctx.fillStyle = W(0.16);
  ctx.font      = '7px "JetBrains Mono",monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`STAGE  ·  ${stages[activeSt]}`, w / 2, h * 0.93);
}

// ── Viz 2: VaultCrypt — Distributed Shard Lattice ────────────────────────────
function drawVaultCrypt(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const cx = w * 0.50, cy = h * 0.47;
  const R  = Math.min(w, h) * 0.30;
  const N  = 6;

  // Shard node positions (hexagonal)
  const shards = Array.from({ length: N }, (_, i) => {
    const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(angle) * R, y: cy + Math.sin(angle) * R, i };
  });

  // Outer ring (very faint)
  const ringPulse = 0.5 + 0.5 * Math.sin(t * 1.2);
  ctx.strokeStyle = W(0.03 + 0.03 * ringPulse);
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.05, 0, Math.PI * 2);
  ctx.stroke();

  // Hexagon edges
  shards.forEach((s, i) => {
    const next = shards[(i + 1) % N];
    const ep   = 0.5 + 0.5 * Math.sin(t * 1.6 + i * 0.9);
    ctx.strokeStyle = W(0.05 + 0.03 * ep);
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(next.x, next.y);
    ctx.stroke();
  });

  // Spoke lines + travelling dot
  const dotPeriod = 3.6;
  shards.forEach((s, i) => {
    ctx.strokeStyle = W(0.06);
    ctx.lineWidth   = 1;
    ctx.setLineDash([2, 5]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(s.x, s.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Each spoke has an offset dot
    const dp  = ((t / dotPeriod) + i / N) % 1;
    const dx  = cx + (s.x - cx) * dp;
    const dy  = cy + (s.y - cy) * dp;
    ctx.fillStyle = B(0.55);
    ctx.beginPath();
    ctx.arc(dx, dy, 1.8, 0, Math.PI * 2);
    ctx.fill();
  });

  // Shard nodes
  const sW = 22, sH = 16;
  const actShard = Math.floor((t * 0.7)) % N;
  shards.forEach(({ x, y, i }) => {
    const lit = i === actShard;
    ctx.strokeStyle = lit ? B(0.60) : W(0.16);
    ctx.lineWidth   = lit ? 1.5 : 1;
    ctx.strokeRect(x - sW / 2, y - sH / 2, sW, sH);
    if (lit) { ctx.fillStyle = B(0.08); ctx.fillRect(x - sW / 2, y - sH / 2, sW, sH); }

    ctx.fillStyle = lit ? B(0.65) : W(0.18);
    ctx.font      = '6px "JetBrains Mono",monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`S${i}`, x, y + 2.5);
  });

  // Central source block
  const srcW = 46, srcH = 30;
  ctx.strokeStyle = W(0.22);
  ctx.lineWidth   = 1;
  ctx.strokeRect(cx - srcW / 2, cy - srcH / 2, srcW, srcH);
  ctx.fillStyle = W(0.22);
  ctx.font      = '7px "JetBrains Mono",monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SOURCE', cx, cy + 2.5);

  // Status
  ctx.fillStyle = W(0.16);
  ctx.font      = '7px "JetBrains Mono",monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`ZERO-KNOWLEDGE  ·  ${N} NODES`, w / 2, h * 0.93);
}

// ── Viz 3: GitScope — AST / Code Tree ────────────────────────────────────────
function drawGitScope(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const root: [number, number] = [w * 0.50, h * 0.07];
  const L1: [number, number][] = [
    [w * 0.28, h * 0.27],
    [w * 0.72, h * 0.27],
  ];
  const L2: [number, number][] = [
    [w * 0.13, h * 0.48],
    [w * 0.40, h * 0.48],
    [w * 0.60, h * 0.48],
    [w * 0.87, h * 0.48],
  ];
  const L3: [number, number][] = [
    [w * 0.09, h * 0.69],
    [w * 0.24, h * 0.69],
    [w * 0.40, h * 0.69],
    [w * 0.60, h * 0.69],
    [w * 0.76, h * 0.69],
    [w * 0.91, h * 0.69],
  ];

  const drawEdge = (a: [number, number], b: [number, number], lit = false) => {
    ctx.strokeStyle = lit ? B(0.50) : W(0.07);
    ctx.lineWidth   = lit ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  };

  // Search path: root → L1[1] → L2[3] → L3[5]
  const searchPath: [number, number][] = [root, L1[1], L2[3], L3[5]];
  const sCycle = 4.0;
  const sT     = (t / sCycle) % 1;
  const sStep  = sT * (searchPath.length - 1);
  const segIdx = Math.min(Math.floor(sStep), searchPath.length - 2);
  const segFrac = sStep - segIdx;

  // All structural edges (background first)
  [[0, 0], [0, 1]].forEach(([, ci]) => drawEdge(root, L1[ci]));
  [[0, 0], [0, 1], [1, 2], [1, 3]].forEach(([pi, ci]) => drawEdge(L1[pi], L2[ci]));
  [[0, 0], [0, 1], [2, 2], [3, 3], [3, 4], [3, 5]].forEach(([pi, ci]) => drawEdge(L2[pi], L3[ci]));

  // Highlight completed path segments
  for (let i = 0; i < segIdx; i++) drawEdge(searchPath[i], searchPath[i + 1], true);
  // In-progress segment
  {
    const a = searchPath[segIdx], b = searchPath[segIdx + 1];
    ctx.strokeStyle = B(0.50);
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(a[0] + (b[0] - a[0]) * segFrac, a[1] + (b[1] - a[1]) * segFrac);
    ctx.stroke();
  }

  // Nodes
  const onPathSet = new Set<string>();
  if (sT > 0)    onPathSet.add('root');
  if (sT > 0.33) onPathSet.add('L1-1');
  if (sT > 0.66) onPathSet.add('L2-3');
  if (sT > 0.92) onPathSet.add('L3-5');

  const allNodes: Array<{ pt: [number, number]; key: string }> = [
    { pt: root,  key: 'root'  },
    { pt: L1[0], key: 'L1-0' }, { pt: L1[1], key: 'L1-1' },
    ...L2.map((p, i) => ({ pt: p as [number, number], key: `L2-${i}` })),
    ...L3.map((p, i) => ({ pt: p as [number, number], key: `L3-${i}` })),
  ];

  allNodes.forEach(({ pt, key }) => {
    const lit = onPathSet.has(key);
    ctx.strokeStyle = lit ? B(0.80) : W(0.14);
    ctx.fillStyle   = lit ? B(0.12) : 'transparent';
    ctx.lineWidth   = lit ? 1.5 : 1;
    ctx.beginPath();
    ctx.arc(pt[0], pt[1], 5, 0, Math.PI * 2);
    ctx.stroke();
    if (lit) ctx.fill();
  });

  // Root label
  ctx.fillStyle = W(0.22);
  ctx.font      = '7px "JetBrains Mono",monospace';
  ctx.textAlign = 'center';
  ctx.fillText('AST ROOT', root[0], root[1] - 13);

  // Leaf labels
  const leafLabels = ['fn parse()', 'mod core', 'impl Scan', 'trait Idx', 'struct Ref', 'enum Op'];
  ctx.font      = '6px "JetBrains Mono",monospace';
  L3.forEach(([x, y], i) => {
    ctx.fillStyle = onPathSet.has(`L3-${i}`) ? B(0.55) : W(0.13);
    ctx.fillText(leafLabels[i], x, y + 15);
  });

  // Semantic search ping on result leaf
  const ping = 0.5 + 0.5 * Math.abs(Math.sin(t * 3.0));
  ctx.strokeStyle = B(0.20 * ping);
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.arc(L3[5][0], L3[5][1], 10 + ping * 8, 0, Math.PI * 2);
  ctx.stroke();

  // Status
  ctx.fillStyle = W(0.15);
  ctx.font      = '7px "JetBrains Mono",monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SEMANTIC SEARCH · ACTIVE', w / 2, h * 0.93);
}

// ── Viz 4: ExpeRelate — Expert Routing Constellation ─────────────────────────
function drawExpeRelate(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // 5 expert nodes arranged in a vertical fan on the right
  const experts = [
    { x: w * 0.78, y: h * 0.14, label: 'AI / ML' },
    { x: w * 0.82, y: h * 0.32, label: 'SYSTEMS' },
    { x: w * 0.80, y: h * 0.50, label: 'BACKEND' },
    { x: w * 0.82, y: h * 0.68, label: 'EMBEDDED' },
    { x: w * 0.78, y: h * 0.86, label: 'RESEARCH' },
  ];
  const N = experts.length;

  const qSrc = { x: w * 0.14, y: h * 0.50 };

  // Evaluation cycle: 7 s total (1.4 s per expert → 7th second = result
  const evalCycle = 7.0;
  const evalT     = (t / evalCycle) % 1;
  const evalStep  = evalT * (N + 1);           // 0 → N+1
  const evalIdx   = Math.min(Math.floor(evalStep), N - 1); // currently evaluating
  const isResult  = evalStep >= N;             // showing result
  const WINNER    = 2;                          // expert index that wins

  // Query source node
  const qPulse = 0.5 + 0.5 * Math.sin(t * 2.5);
  ctx.strokeStyle = B(0.16 + 0.14 * qPulse);
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.arc(qSrc.x, qSrc.y, 7 + qPulse * 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = B(0.60);
  ctx.beginPath();
  ctx.arc(qSrc.x, qSrc.y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = W(0.22);
  ctx.font      = '7px "JetBrains Mono",monospace';
  ctx.textAlign = 'center';
  ctx.fillText('QUERY', qSrc.x, qSrc.y - 14);

  // Routing lines query → each expert
  experts.forEach((ex, ei) => {
    const evaluated = ei <= evalIdx;
    const winner    = isResult && ei === WINNER;
    const dimmed    = isResult && ei !== WINNER;
    ctx.strokeStyle = winner ? B(0.60)
                    : evaluated ? W(0.16)
                    : W(0.06);
    ctx.lineWidth   = winner ? 1.5 : 1;
    ctx.setLineDash(evaluated ? [] : [3, 6]);
    ctx.beginPath();
    ctx.moveTo(qSrc.x + 6, qSrc.y);
    ctx.lineTo(ex.x - 14,  ex.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Score dot along the line
    if (evaluated && !isResult) {
      const score = 0.4 + 0.5 * (1 - Math.abs(ei - WINNER) / N);
      const dotX  = qSrc.x + (ex.x - 14 - qSrc.x) * score;
      const dotY  = qSrc.y + (ex.y - qSrc.y) * score;
      ctx.fillStyle = W(0.18);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Expert nodes
  const nR = 10;
  experts.forEach((ex, ei) => {
    const evaluated = ei <= evalIdx;
    const winner    = isResult && ei === WINNER;
    const score     = (0.4 + 0.55 * (1 - Math.abs(ei - WINNER) / N));
    ctx.strokeStyle = winner ? B(0.75) : evaluated ? W(score * 0.35) : W(0.09);
    ctx.lineWidth   = winner ? 2 : 1;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, nR, 0, Math.PI * 2);
    ctx.stroke();
    if (winner) { ctx.fillStyle = B(0.09); ctx.fill(); }

    ctx.fillStyle = winner ? B(0.70) : evaluated ? W(0.25) : W(0.12);
    ctx.font      = winner ? '7px "JetBrains Mono",monospace' : '6px "JetBrains Mono",monospace';
    ctx.textAlign = 'left';
    ctx.fillText(ex.label, ex.x + nR + 5, ex.y + 2.5);

    if (winner) {
      ctx.fillStyle = B(0.65);
      ctx.font      = '6px "JetBrains Mono",monospace';
      ctx.fillText('▸ MATCH', ex.x + nR + 5, ex.y + 12);
    }
  });

  // Evaluation progress bar at bottom
  const barX  = w * 0.08, barY = h * 0.93, barW = w * 0.84;
  const prog  = Math.min(evalT * N, 1);
  ctx.strokeStyle = W(0.08);
  ctx.lineWidth   = 1;
  ctx.strokeRect(barX, barY, barW, 3);
  ctx.fillStyle = isResult ? B(0.55) : W(0.20);
  ctx.fillRect(barX, barY, barW * prog, 3);
  ctx.fillStyle = W(0.15);
  ctx.font      = '7px "JetBrains Mono",monospace';
  ctx.textAlign = 'left';
  ctx.fillText(isResult ? 'RANKED · MATCH FOUND' : `EVALUATING · ${evalIdx + 1}/${N}`, barX, barY - 5);
}

const DRAW_FNS = [drawGSOC, drawSamsung, drawVaultCrypt, drawGitScope, drawExpeRelate];

// ═════════════════════════════════════════════════════════════════════════════
// Sub-components
// ═════════════════════════════════════════════════════════════════════════════

function LinkBtn({ label, href, primary }: { label: string; href: string | null; primary: boolean }) {
  const [hov, setHov] = useState(false);

  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontFamily: 'var(--font-jetbrains), monospace',
    fontSize: '9px',
    fontWeight: 400,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    textDecoration: 'none',
    cursor: href ? 'pointer' : 'default',
    transition: 'color 0.2s ease, border-color 0.2s ease',
    opacity: href ? 1 : 0.38,
  };

  const primaryStyle: React.CSSProperties = {
    ...base,
    padding: '6px 14px',
    border: `1px solid ${hov ? 'var(--border-subtle)' : 'var(--border-rest)'}`,
    color: hov ? 'var(--text-primary)' : 'var(--text-secondary)',
  };

  const secondaryStyle: React.CSSProperties = {
    ...base,
    padding: '0',
    borderBottom: `1px solid ${hov ? 'var(--border-subtle)' : 'var(--border-rest)'}`,
    paddingBottom: '2px',
    color: hov ? 'var(--text-secondary)' : 'var(--text-tertiary)',
  };

  const style = primary ? primaryStyle : secondaryStyle;

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={style}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
      >
        {label} ↗
      </a>
    );
  }
  return (
    <span
      style={style}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {label} ↗
    </span>
  );
}

function ProjectRow({
  project,
  extra,
  isActive,
}: {
  project: Project;
  extra: ExtraEntry;
  isActive: boolean;
}) {
  return (
    <article
      style={{
        borderTop: '1px solid var(--border-rest)',
        paddingTop:    'clamp(13px, 1.8vh, 20px)',
        paddingBottom: isActive ? 'clamp(18px, 2.4vh, 28px)' : 'clamp(13px, 1.8vh, 20px)',
        transition: 'padding-bottom 0.5s cubic-bezier(0.25,0,0.35,1)',
      }}
    >
      {/* Collapsed header: index · title · category · year */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2.4rem 1fr auto auto',
          gap: '0 18px',
          alignItems: 'baseline',
        }}
      >
        <span className="text-mono" style={{ color: 'var(--text-tertiary)' }}>
          {project.index}
        </span>

        <h3
          style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: isActive ? 'clamp(17px, 1.6vw, 24px)' : 'clamp(13px, 1.1vw, 17px)',
            fontWeight: isActive ? 500 : 400,
            lineHeight: 1.2,
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            transition:
              'font-size 0.45s cubic-bezier(0.25,0,0.35,1), color 0.3s ease, font-weight 0.3s ease',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {project.title}
        </h3>

        <span
          className="text-mono"
          style={{
            color: 'var(--text-tertiary)',
            textAlign: 'right',
            opacity: isActive ? 0 : 1,
            transition: 'opacity 0.25s ease',
            whiteSpace: 'nowrap',
          }}
        >
          {project.category.split('·')[0].trim()}
        </span>

        <span
          className="text-mono"
          style={{
            color: 'var(--text-tertiary)',
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
            opacity: isActive ? 0 : 1,
            transition: 'opacity 0.25s ease',
          }}
        >
          {project.year}
        </span>
      </div>

      {/* Expanded body — collapses when inactive */}
      <div
        style={{
          overflow: 'hidden',
          maxHeight: isActive ? '300px' : '0px',
          opacity:   isActive ? 1 : 0,
          transition:
            'max-height 0.55s cubic-bezier(0.25,0,0.35,1), opacity 0.40s ease',
        }}
      >
        <div
          style={{
            paddingTop:  '14px',
            paddingLeft: 'calc(2.4rem + 18px)',
            transform:   isActive ? 'translateY(0px)' : 'translateY(7px)',
            transition:  'transform 0.52s cubic-bezier(0.25,0,0.35,1)',
          }}
        >
          {/* Domain + year */}
          <p
            className="text-mono"
            style={{ color: 'var(--text-tertiary)', marginBottom: '10px' }}
          >
            {project.category} · {project.year}
          </p>

          {/* Description */}
          <p
            className="text-body"
            style={{
              color:        'var(--text-secondary)',
              fontSize:     'clamp(13px, 0.88vw, 15px)',
              lineHeight:   1.65,
              maxWidth:     '540px',
              marginBottom: '16px',
            }}
          >
            {project.description}
          </p>

          {/* Tech chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '18px' }}>
            {project.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <LinkBtn label={extra.primaryCta} href={extra.primaryHref} primary />
            {extra.secondaryCta && (
              <LinkBtn label={extra.secondaryCta} href={extra.secondaryHref} primary={false} />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Main section component
// ═════════════════════════════════════════════════════════════════════════════

export default function Projects() {
  const outerRef     = useRef<HTMLElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // Mutable canvas cross-fade state — never triggers re-renders
  const vizRef       = useRef({ from: 0, to: 0, alpha: 1.0, transitioning: false });
  // Mirror of activeIdx for use inside scroll handler without stale closure
  const activeIdxRef = useRef(0);

  const animRef      = useRef(0);
  const rafPending   = useRef(false);

  const visible = projects.filter(
    (p) => p.configKey === null || siteConfig[p.configKey]
  );
  const N = visible.length;

  // ── Scroll → active project ───────────────────────────────────────────────
  useEffect(() => {
    const outer   = outerRef.current;
    if (!outer) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    function tick() {
      rafPending.current = false;
      const rect            = outer!.getBoundingClientRect();
      const scrolled        = Math.max(0, -rect.top);
      const totalScrollable = outer!.offsetHeight - window.innerHeight;
      if (totalScrollable <= 0) return;

      const progress = Math.min(1, scrolled / totalScrollable);
      const newIdx   = Math.min(Math.floor(progress * N), N - 1);

      if (newIdx !== activeIdxRef.current) {
        activeIdxRef.current = newIdx;
        // Kick canvas cross-fade before state update
        const vz    = vizRef.current;
        vz.from     = vz.to;
        vz.to       = newIdx;
        vz.alpha    = 0;
        vz.transitioning = true;
        setActiveIdx(newIdx);
      }
    }

    function onScroll() {
      if (rafPending.current) return;
      rafPending.current = true;
      requestAnimationFrame(tick);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [N]);

  // ── Canvas rAF draw loop ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rawCtx = canvas.getContext('2d');
    if (!rawCtx) return;
    // Typed as non-null so closures below don't lose the narrowing
    const ctx: CanvasRenderingContext2D = rawCtx;

    const ro = new ResizeObserver(() => {
      const dpr     = window.devicePixelRatio || 1;
      canvas.width  = Math.round(canvas.offsetWidth  * dpr);
      canvas.height = Math.round(canvas.offsetHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    ro.observe(canvas);

    const vz = vizRef.current;

    function draw(ts: number) {
      const t  = ts / 1000;
      const cw = canvas!.offsetWidth;
      const ch = canvas!.offsetHeight;

      // Reset transform to clear physical pixels, then restore
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx.restore();

      if (vz.transitioning) {
        vz.alpha = Math.min(1, vz.alpha + 0.045);
        if (vz.alpha >= 1) {
          vz.from          = vz.to;
          vz.transitioning = false;
        }
        ctx.globalAlpha = 1 - vz.alpha;
        DRAW_FNS[vz.from]?.(ctx, cw, ch, t);
        ctx.globalAlpha = vz.alpha;
        DRAW_FNS[vz.to]?.(ctx, cw, ch, t);
        ctx.globalAlpha = 1;
      } else {
        DRAW_FNS[vz.to]?.(ctx, cw, ch, t);
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section
      id="sbc-showcase"
      ref={outerRef}
      aria-labelledby="projects-heading"
      style={{
        position: 'relative',
        height:   `${(N + 1) * 100}vh`,
        borderTop: '1px solid var(--border-rest)',
      }}
    >
      {/* ── Sticky viewport panel ─────────────────────────────────────────── */}
      <div
        style={{
          position: 'sticky',
          top:      0,
          height:   '100vh',
          overflow: 'hidden',
          display:  'flex',
          alignItems: 'center',
        }}
      >
        {/* Faint background grid that slowly drifts */}
        <div
          aria-hidden
          className="grid-drift"
          style={{
            position: 'absolute',
            inset:    '-60px',
            backgroundImage: [
              'repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(255,255,255,0.016) 60px)',
              'repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(255,255,255,0.010) 60px)',
            ].join(', '),
            animation:     'gridDrift 30s linear infinite',
            pointerEvents: 'none',
            zIndex:        0,
          }}
        />

        {/* ── Two-column content layout ────────────────────────────────── */}
        <div
          style={{
            position: 'relative',
            zIndex:   1,
            width:    '100%',
            maxWidth: '1440px',
            margin:   '0 auto',
            padding:  `clamp(28px, 4.5vh, 52px) clamp(24px, 5.5vw, 80px)`,
            display:  'grid',
            gridTemplateColumns: '1fr 340px',
            gap:      'clamp(40px, 5vw, 80px)',
            alignItems: 'center',
          }}
        >
          {/* ── Left: project list ─────────────────────────────────────── */}
          <div>
            {/* Section label */}
            <p
              className="text-mono"
              style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}
            >
              03 / SELECTED WORK
            </p>

            {/* Heading */}
            <h2
              id="projects-heading"
              className="text-section"
              style={{ color: 'var(--text-primary)', marginBottom: '36px' }}
            >
              Selected Work
            </h2>

            {/* Project rows */}
            <div>
              {visible.map((project, i) => {
                const extra = EXTRA.find((e) => e.id === project.id) ?? EXTRA[Math.min(i, EXTRA.length - 1)];
                return (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    extra={extra}
                    isActive={activeIdx === i}
                  />
                );
              })}
              {/* Bottom border after last row */}
              <div style={{ borderTop: '1px solid var(--border-rest)' }} />
            </div>

            {/* Progress bar + counter */}
            <div
              style={{
                display:    'flex',
                alignItems: 'center',
                gap:        '8px',
                paddingTop: '20px',
              }}
            >
              {visible.map((_, i) => (
                <span
                  key={i}
                  style={{
                    display:      'block',
                    height:       '2px',
                    width:        i === activeIdx ? '24px' : '8px',
                    borderRadius: '1px',
                    background:
                      i === activeIdx
                        ? 'var(--text-primary)'
                        : 'var(--text-tertiary)',
                    transition:
                      'width 0.45s cubic-bezier(0.25,0,0.35,1), background 0.3s ease',
                  }}
                />
              ))}
              <span
                className="text-mono"
                style={{
                  color:      'var(--text-tertiary)',
                  marginLeft: '8px',
                  fontSize:   '9px',
                }}
              >
                {String(activeIdx + 1).padStart(2, '0')} / {String(N).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* ── Right: canvas visualization ───────────────────────────── */}
          <div
            style={{
              display:        'flex',
              flexDirection:  'column',
              gap:            '10px',
            }}
          >
            {/* Small viz label */}
            <div
              style={{
                display:        'flex',
                justifyContent: 'space-between',
                alignItems:     'center',
              }}
            >
              <span
                className="text-mono"
                style={{ color: 'var(--text-tertiary)', fontSize: '9px' }}
              >
                VIZ · {String(activeIdx + 1).padStart(2, '0')}
              </span>
              <span
                className="text-mono"
                style={{ color: 'var(--text-tertiary)', fontSize: '9px' }}
              >
                {visible[activeIdx]?.category.split('·')[0].trim()}
              </span>
            </div>

            {/* Canvas frame */}
            <div
              style={{
                width:    '340px',
                height:   '340px',
                border:   '1px solid var(--border-rest)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Corner accent ticks */}
              {(
                [
                  { top: 0,    left:  0,  borderTop:    '1px solid var(--border-subtle)', borderLeft:   '1px solid var(--border-subtle)' },
                  { top: 0,    right: 0,  borderTop:    '1px solid var(--border-subtle)', borderRight:  '1px solid var(--border-subtle)' },
                  { bottom: 0, left:  0,  borderBottom: '1px solid var(--border-subtle)', borderLeft:   '1px solid var(--border-subtle)' },
                  { bottom: 0, right: 0,  borderBottom: '1px solid var(--border-subtle)', borderRight:  '1px solid var(--border-subtle)' },
                ] as React.CSSProperties[]
              ).map((cs, i) => (
                <span
                  key={i}
                  style={{
                    position: 'absolute',
                    width:    10,
                    height:   10,
                    ...cs,
                  }}
                />
              ))}

              <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
