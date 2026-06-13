'use client';

import { useEffect, useRef, useState } from 'react';

// ── Math ──────────────────────────────────────────────────────────────────────
function c01(t: number) { return Math.max(0, Math.min(1, t)); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function eo3(t: number) { return 1 - Math.pow(1 - t, 3); }
function eo5(t: number) { return 1 - Math.pow(1 - t, 5); }
function eio(t: number) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
function sub(pe: number, s: number, e: number) { return c01((pe - s) / (e - s)); }

// ── Geometry ──────────────────────────────────────────────────────────────────
// All _F values are fractions of canvas dimension
const DECK_F    = 0.54;   // deck centerline
const TOW_TOP_F = 0.10;   // tower top
const SAG_F     = 0.37;   // cable mid-span sag
const ANCH_LF   = 0.04;
const ANCH_RF   = 0.96;
const TOW_LF    = 0.20;
const TOW_RF    = 0.80;
const WATER_F   = 0.72;   // waterline
const SEA_F     = 0.86;   // seafloor average
const PILE_F    = 0.82;   // pile tip depth
const TRUSS_TOP = 46;     // px above deck
const TRUSS_BOT = 14;     // px below deck
const PANEL_W   = 30;     // Warren truss panel width
const HANGER_N  = 24;
const CW        = 10;     // tower column half-width (each leg side)
const LEG_SEP   = 20;     // distance between inner faces of the two tower legs

function cabY(xF: number, w: number, h: number): number {
  const mx  = (TOW_LF + TOW_RF) / 2;
  const a   = (TOW_TOP_F - SAG_F) / Math.pow(mx - TOW_LF, 2);
  return (a * Math.pow(xF - mx, 2) + SAG_F) * h;
}

// ── Oscilloscope grid ─────────────────────────────────────────────────────────
function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, a: number) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(200,228,255,1)';
  ctx.lineWidth = 0.4;
  const cols = 24, rows = 14;
  for (let c = 0; c <= cols; c++) {
    ctx.globalAlpha = a * 0.035;
    ctx.beginPath(); ctx.moveTo((c / cols) * w, 0); ctx.lineTo((c / cols) * w, h); ctx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    ctx.globalAlpha = a * 0.035;
    ctx.beginPath(); ctx.moveTo(0, (r / rows) * h); ctx.lineTo(w, (r / rows) * h); ctx.stroke();
  }
  ctx.globalAlpha = a * 0.09;
  ctx.lineWidth = 0.7;
  ctx.setLineDash([6, 8]);
  ctx.beginPath(); ctx.moveTo(0, DECK_F * h); ctx.lineTo(w, DECK_F * h); ctx.stroke();
  // Deck axis tick marks
  ctx.setLineDash([]);
  ctx.lineWidth = 0.4;
  for (let c = 0; c <= cols; c++) {
    const x = (c / cols) * w;
    ctx.globalAlpha = a * 0.15;
    ctx.beginPath(); ctx.moveTo(x, DECK_F * h - 4); ctx.lineTo(x, DECK_F * h + 4); ctx.stroke();
  }
  ctx.restore();
}

// ── Elevation reference axis ──────────────────────────────────────────────────
function drawElevAxis(ctx: CanvasRenderingContext2D, w: number, h: number, p: number) {
  if (p <= 0) return;
  const pe = eo3(p);
  ctx.save();
  ctx.strokeStyle = 'rgba(200,228,255,1)';
  ctx.fillStyle   = 'rgba(200,228,255,1)';
  ctx.lineWidth = 0.5;
  ctx.setLineDash([2, 4]);

  // Vertical datum line on far left
  ctx.globalAlpha = pe * 0.22;
  const ax = 28;
  ctx.beginPath(); ctx.moveTo(ax, TOW_TOP_F * h - 20); ctx.lineTo(ax, SEA_F * h + 20); ctx.stroke();
  ctx.setLineDash([]);

  // Elevation ticks + labels every 30m (arbitrary scale)
  const elevations = [
    { yF: TOW_TOP_F, label: '+152m' },
    { yF: DECK_F,    label: '+0m'   },
    { yF: WATER_F,   label: '-18m'  },
    { yF: SEA_F,     label: '-42m'  },
  ];
  ctx.font = '7px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  elevations.forEach(({ yF, label }) => {
    const y = yF * h;
    const ep = sub(pe, 0, 0.8);
    ctx.globalAlpha = ep * 0.38;
    ctx.beginPath(); ctx.moveTo(ax - 5, y); ctx.lineTo(ax + 5, y); ctx.stroke();
    ctx.fillText(label, ax - 7, y + 3);
  });

  // Benchmark triangle at deck level
  if (pe > 0.6) {
    const bp = sub(pe, 0.6, 1.0);
    ctx.globalAlpha = bp * 0.45;
    const bx = ax, by = DECK_F * h;
    ctx.beginPath();
    ctx.moveTo(bx, by - 8); ctx.lineTo(bx - 5, by + 4); ctx.lineTo(bx + 5, by + 4); ctx.closePath();
    ctx.stroke();
    ctx.font = '6px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('BM-02', bx + 7, by + 3);
  }
  ctx.restore();
}

// ── Seafloor + soil strata ────────────────────────────────────────────────────
function drawSeafloor(ctx: CanvasRenderingContext2D, w: number, h: number, p: number) {
  if (p <= 0) return;
  const pe = eo3(p);
  const seafloorPts: [number, number][] = [
    [0,    SEA_F + 0.02],
    [0.08, SEA_F + 0.01],
    [0.15, SEA_F + 0.03],
    [0.25, SEA_F - 0.01],
    [0.35, SEA_F + 0.02],
    [0.50, SEA_F + 0.005],
    [0.65, SEA_F + 0.02],
    [0.75, SEA_F - 0.01],
    [0.85, SEA_F + 0.01],
    [0.92, SEA_F + 0.02],
    [1.00, SEA_F + 0.01],
  ];

  ctx.save();
  // Seafloor profile
  ctx.globalAlpha = pe * 0.40;
  ctx.strokeStyle = 'rgba(255,255,255,1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  seafloorPts.forEach(([xF, yF], i) => {
    const x = xF * w, y = yF * h;
    if (xF > pe) return;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Soil strata layers (below seafloor)
  if (pe > 0.3) {
    const sp = sub(pe, 0.3, 0.8);
    const strata = [
      { depF: 0.03, label: 'SILTY SAND (SM)', dash: [4, 3] as [number,number] },
      { depF: 0.06, label: 'GRAVEL (GW)',     dash: [8, 3] as [number,number] },
      { depF: 0.10, label: 'BEDROCK (RQD 85)',dash: [2, 2] as [number,number] },
    ];
    strata.forEach(({ depF, label, dash }, i) => {
      const y = (SEA_F + depF) * h;
      if (y > h) return;
      ctx.globalAlpha = sp * 0.18;
      ctx.lineWidth = 0.5;
      ctx.setLineDash(dash);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w * sp, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = sp * 0.28 * sub(sp, i * 0.2, i * 0.2 + 0.5);
      ctx.font = '7px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(200,228,255,1)';
      ctx.fillText(label, 34, y - 3);
    });
  }

  // Water depth soundings between towers
  if (pe > 0.55) {
    const wp = sub(pe, 0.55, 0.9);
    const soundings = [0.30, 0.40, 0.50, 0.60, 0.70];
    ctx.font = '7px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(200,228,255,1)';
    soundings.forEach((xF, i) => {
      const depth = [18.2, 21.5, 23.0, 20.8, 17.6][i];
      ctx.globalAlpha = wp * 0.32;
      ctx.fillText(`${depth}m`, xF * w, WATER_F * h + 16);
      // Sounding tick
      ctx.lineWidth = 0.4;
      ctx.strokeStyle = 'rgba(200,228,255,1)';
      ctx.beginPath();
      ctx.moveTo(xF * w, WATER_F * h + 4);
      ctx.lineTo(xF * w, WATER_F * h + 10);
      ctx.stroke();
    });
  }
  ctx.restore();
}

// ── Waterlines ────────────────────────────────────────────────────────────────
function drawWaterlines(ctx: CanvasRenderingContext2D, w: number, h: number, p: number) {
  if (p <= 0) return;
  const pe = eo3(p);
  ctx.save();

  const lines = [
    { yF: WATER_F - 0.03, label: 'H.W.M. +2.1m', dash: [6,4] as [number,number], a: 0.30 },
    { yF: WATER_F,        label: 'M.W.L. +0.0m', dash: [10,5] as [number,number], a: 0.40 },
    { yF: WATER_F + 0.03, label: 'L.W.M. -1.8m', dash: [3,5] as [number,number],  a: 0.24 },
  ];

  ctx.font = '7px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(200,228,255,1)';
  lines.forEach(({ yF, label, dash, a }, i) => {
    const lp = sub(pe, i * 0.2, i * 0.2 + 0.7);
    const y  = yF * h;
    ctx.globalAlpha = lp * a;
    ctx.strokeStyle = 'rgba(200,228,255,1)';
    ctx.lineWidth = 0.6;
    ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(34, y); ctx.lineTo(w * lp * 0.85 + 34, y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.textAlign = 'left';
    ctx.globalAlpha = lp * (a + 0.05);
    ctx.fillText(label, w * 0.87, y - 3);
  });

  // Navigation clearance envelope (dashed box between towers, deck to water)
  if (pe > 0.6) {
    const cp = sub(pe, 0.6, 0.95);
    const lx = TOW_LF * w, rx = TOW_RF * w;
    const deckY = DECK_F * h, mwlY = WATER_F * h;
    ctx.globalAlpha = cp * 0.20;
    ctx.strokeStyle = 'rgba(200,228,255,1)';
    ctx.lineWidth = 0.7;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(lx + 12, deckY + 4, rx - lx - 24, mwlY - deckY - 8);
    ctx.setLineDash([]);
    ctx.font = '7px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.globalAlpha = cp * 0.32;
    ctx.fillText('NAVIGATION CLEARANCE: 65m', (lx + rx) / 2, mwlY - 22);
  }
  ctx.restore();
}

// ── Pier shafts + batter piles ────────────────────────────────────────────────
function drawFoundations(ctx: CanvasRenderingContext2D, w: number, h: number, p: number) {
  if (p <= 0) return;
  const pe = eo5(p);
  const deckY = DECK_F * h;
  const pileY = PILE_F * h;
  const lx = TOW_LF * w, rx = TOW_RF * w;
  const alx = ANCH_LF * w, arx = ANCH_RF * w;

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,1)';

  // Pier shafts at towers (wide concrete pier, from seafloor to deck)
  [[lx], [rx]].forEach(([tx]) => {
    const pw = 28; // pier width
    // Pier shaft outline
    ctx.globalAlpha = 0.30 * pe;
    ctx.lineWidth = 0.9;
    ctx.strokeRect(tx - pw, deckY + TRUSS_BOT, pw * 2, SEA_F * h - (deckY + TRUSS_BOT));

    // Construction joints every ~40px down the shaft
    const joints = Math.round(((SEA_F * h) - (deckY + TRUSS_BOT)) / 40 * pe);
    ctx.globalAlpha = 0.14 * pe;
    ctx.lineWidth = 0.5;
    for (let j = 1; j <= joints; j++) {
      const jy = deckY + TRUSS_BOT + j * 40;
      ctx.beginPath(); ctx.moveTo(tx - pw, jy); ctx.lineTo(tx + pw, jy); ctx.stroke();
    }

    // Batter piles (angled outward) below pier cap
    const batterAngles = [-0.18, -0.09, 0, 0.09, 0.18]; // slope dx/dy
    ctx.lineWidth = 0.6;
    batterAngles.forEach((slope, i) => {
      const pp = c01((pe - i * 0.08) / 0.55);
      if (pp <= 0) return;
      const pileLen = pileY - (SEA_F * h);
      const x0 = tx + slope * 40 * (i % 2 === 0 ? 1 : -1);
      const x1 = x0 + slope * pileLen * 0.8;
      ctx.globalAlpha = 0.22 * pp;
      ctx.beginPath();
      ctx.moveTo(x0, SEA_F * h);
      ctx.lineTo(x1, pileY);
      ctx.stroke();
    });

    // Pile cap at top of piles
    if (pe > 0.5) {
      ctx.globalAlpha = 0.26 * sub(pe, 0.5, 0.9);
      ctx.lineWidth = 1.1;
      ctx.strokeRect(tx - pw - 6, SEA_F * h, (pw + 6) * 2, 12);
    }
  });

  // Anchor caissons — massive concrete blocks at anchor points
  if (pe > 0.28) {
    const ap = sub(pe, 0.28, 0.75);
    ctx.lineWidth = 1.0;
    [[alx, -1], [arx, 1]].forEach(([ax, _]) => {
      const aw = 36, ah = 48;
      ctx.globalAlpha = 0.28 * ap;
      ctx.strokeRect(ax - aw, deckY - 6, aw * 2, ah);
      // Horizontal lift lines (construction block layers)
      ctx.globalAlpha = 0.12 * ap;
      ctx.lineWidth = 0.4;
      for (let l = 1; l <= 3; l++) {
        const ly = deckY - 6 + l * 12;
        ctx.beginPath(); ctx.moveTo(ax - aw, ly); ctx.lineTo(ax + aw, ly); ctx.stroke();
      }
      // Anchor rod schematic
      if (ap > 0.5) {
        const rp = sub(ap, 0.5, 1.0);
        ctx.globalAlpha = 0.20 * rp;
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 3]);
        [-12, -4, 4, 12].forEach(ox => {
          ctx.beginPath();
          ctx.moveTo(ax + ox, deckY + ah - 6);
          ctx.lineTo(ax + ox, pileY);
          ctx.stroke();
        });
        ctx.setLineDash([]);
      }
    });
  }
  ctx.restore();
}

// ── Approach box girder spans ─────────────────────────────────────────────────
function drawApproachSpans(ctx: CanvasRenderingContext2D, w: number, h: number, p: number) {
  if (p <= 0) return;
  const pe = eo3(p);
  const deckY = DECK_F * h;
  const lx = TOW_LF * w, rx = TOW_RF * w;
  const alx = ANCH_LF * w, arx = ANCH_RF * w;
  const gh  = 36; // girder height

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,1)';
  ctx.lineJoin = 'miter';

  [[alx, lx], [rx, arx]].forEach(([x0, x1], side) => {
    const spanLen = Math.abs(x1 - x0);
    const ex = x0 + (x1 - x0) * pe;

    // Box girder top plate
    ctx.globalAlpha = 0.82;
    ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(x0, deckY); ctx.lineTo(ex, deckY); ctx.stroke();
    // Bottom flange
    ctx.globalAlpha = 0.44;
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x0, deckY + gh); ctx.lineTo(ex, deckY + gh); ctx.stroke();
    // Web plate (outer edge)
    ctx.globalAlpha = 0.52;
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x0, deckY); ctx.lineTo(x0, deckY + gh); ctx.stroke();
    if (Math.abs(ex - x1) < 2) { // only draw closing web when complete
      ctx.beginPath(); ctx.moveTo(ex, deckY); ctx.lineTo(ex, deckY + gh); ctx.stroke();
    }

    // Web stiffeners every ~48px
    if (pe > 0.12) {
      ctx.globalAlpha = 0.14;
      ctx.lineWidth = 0.5;
      const num = Math.floor(spanLen * pe / 48);
      for (let i = 1; i <= num; i++) {
        const sx = x0 + (x1 - x0) * (i / (Math.floor(spanLen / 48) + 1));
        ctx.beginPath(); ctx.moveTo(sx, deckY); ctx.lineTo(sx, deckY + gh); ctx.stroke();
      }
    }

    // Diaphragm / interior cross-frame markers (small X inside girder)
    if (pe > 0.4) {
      const dp = sub(pe, 0.4, 0.85);
      ctx.globalAlpha = 0.09 * dp;
      ctx.lineWidth = 0.4;
      const numD = Math.floor(spanLen / 96);
      for (let i = 1; i <= numD; i++) {
        const dx = x0 + (x1 - x0) * (i / (numD + 1));
        if ((side === 0 ? dx < ex : dx > x0 + (x1 - x0) * (1 - pe))) continue;
        ctx.beginPath(); ctx.moveTo(dx - 10, deckY + 4); ctx.lineTo(dx + 10, deckY + gh - 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(dx + 10, deckY + 4); ctx.lineTo(dx - 10, deckY + gh - 4); ctx.stroke();
      }
    }
  });
  ctx.restore();
}

// ── Main span deep Warren truss ───────────────────────────────────────────────
function drawDeckTruss(ctx: CanvasRenderingContext2D, w: number, h: number, p: number) {
  if (p <= 0) return;
  const pe = eo3(p);
  const deckY  = DECK_F * h;
  const topY   = deckY - TRUSS_TOP;
  const botY   = deckY + TRUSS_BOT;
  const midY   = deckY - TRUSS_TOP * 0.5; // secondary chord
  const lx = TOW_LF * w, rx = TOW_RF * w;
  const alx = ANCH_LF * w, arx = ANCH_RF * w;
  const ex = lerp(alx, arx, pe);

  ctx.save();
  ctx.lineJoin = 'miter';

  // Chords
  ctx.lineWidth = 1.6; ctx.globalAlpha = 0.88; ctx.strokeStyle = 'rgba(255,255,255,1)';
  ctx.beginPath(); ctx.moveTo(alx, deckY); ctx.lineTo(ex, deckY); ctx.stroke();

  ctx.lineWidth = 1.1; ctx.globalAlpha = 0.60;
  ctx.beginPath(); ctx.moveTo(alx, topY); ctx.lineTo(ex, topY); ctx.stroke();

  ctx.lineWidth = 0.8; ctx.globalAlpha = 0.42;
  ctx.beginPath(); ctx.moveTo(alx, botY); ctx.lineTo(ex, botY); ctx.stroke();

  // Secondary / stringer chord at mid-height
  ctx.lineWidth = 0.6; ctx.globalAlpha = 0.28;
  ctx.beginPath(); ctx.moveTo(alx, midY); ctx.lineTo(ex, midY); ctx.stroke();

  // Warren truss panels
  if (pe > 0.04) {
    const totalPanels = Math.floor((arx - alx) / PANEL_W);
    const visibleP = Math.floor((ex - alx) / PANEL_W);

    for (let i = 0; i <= visibleP; i++) {
      const x0 = alx + i * PANEL_W;
      if (x0 > ex) break;
      const x1 = Math.min(alx + (i + 1) * PANEL_W, ex);

      // Vertical stiffener
      ctx.globalAlpha = 0.42; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(x0, topY); ctx.lineTo(x0, botY); ctx.stroke();

      // Warren diagonal (alternating)
      if (i < totalPanels) {
        ctx.globalAlpha = 0.32; ctx.lineWidth = 0.65;
        if (i % 2 === 0) {
          ctx.beginPath(); ctx.moveTo(x0, botY); ctx.lineTo(x1, topY); ctx.stroke();
          // Sub-diagonal from secondary chord
          ctx.globalAlpha = 0.15;
          ctx.beginPath(); ctx.moveTo(x0, deckY); ctx.lineTo(x1, midY); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.moveTo(x0, topY); ctx.lineTo(x1, botY); ctx.stroke();
          ctx.globalAlpha = 0.15;
          ctx.beginPath(); ctx.moveTo(x0, midY); ctx.lineTo(x1, deckY); ctx.stroke();
        }
      }

      // Floor beam (transverse) every 4 panels — slightly bolder vertical
      if (i % 4 === 0 && i > 0) {
        ctx.globalAlpha = 0.55; ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(x0, topY - 2); ctx.lineTo(x0, botY + 2); ctx.stroke();
      }
    }
  }

  // Orthotropic deck surface — fine transverse lines on top chord
  if (pe > 0.25) {
    const op = sub(pe, 0.25, 0.70);
    const numOrt = Math.floor((ex - alx) / 10 * op);
    ctx.lineWidth = 0.4; ctx.globalAlpha = 0.07;
    for (let i = 0; i < numOrt; i++) {
      const x = alx + i * 10;
      if (x > ex) break;
      ctx.beginPath(); ctx.moveTo(x, topY); ctx.lineTo(x, topY + 5); ctx.stroke();
    }
  }

  // Curb / railing line at top chord
  if (pe > 0.35) {
    const rp = sub(pe, 0.35, 0.72);
    ctx.globalAlpha = 0.12 * rp; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(alx, topY - 6); ctx.lineTo(Math.min(ex, arx), topY - 6); ctx.stroke();
  }

  ctx.restore();
}

// ── Towers ────────────────────────────────────────────────────────────────────
function drawTowers(ctx: CanvasRenderingContext2D, w: number, h: number, p: number) {
  if (p <= 0) return;
  const pe  = eo3(p);
  const deckY = DECK_F * h;
  const tty   = TOW_TOP_F * h;
  const towerH = deckY - tty;
  const lx = TOW_LF * w, rx = TOW_RF * w;

  // Each tower has two legs; each leg is a double-line (box section)
  // Left leg inner edge: lx - LEG_SEP/2
  // Left leg outer edge: lx - LEG_SEP/2 - CW*2
  // Right leg inner:     lx + LEG_SEP/2
  // Right leg outer:     lx + LEG_SEP/2 + CW*2
  const topLY = lerp(deckY, tty, pe);

  ctx.save();
  ctx.lineJoin = 'miter';

  [[lx], [rx]].forEach(([tx]) => {
    const li = tx - LEG_SEP / 2;       // left leg inner face
    const lo = tx - LEG_SEP / 2 - CW * 2; // left leg outer face
    const ri = tx + LEG_SEP / 2;
    const ro = tx + LEG_SEP / 2 + CW * 2;

    // Outer face columns (solid, heavier)
    ctx.globalAlpha = 0.90; ctx.lineWidth = 1.8; ctx.strokeStyle = 'rgba(255,255,255,1)';
    ctx.beginPath();
    ctx.moveTo(lo, deckY); ctx.lineTo(lo, topLY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ro, deckY); ctx.lineTo(ro, topLY);
    ctx.stroke();

    // Inner face columns (slightly lighter)
    ctx.globalAlpha = 0.68; ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(li, deckY); ctx.lineTo(li, topLY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ri, deckY); ctx.lineTo(ri, topLY);
    ctx.stroke();

    // Base pedestal (wider footing at deck level)
    if (pe > 0.10) {
      const bp = sub(pe, 0.10, 0.35);
      ctx.globalAlpha = 0.50 * bp; ctx.lineWidth = 1.2;
      const padW = 8;
      ctx.beginPath();
      ctx.moveTo(lo - padW, deckY); ctx.lineTo(lo - padW, deckY + TRUSS_BOT + 8);
      ctx.lineTo(ro + padW, deckY + TRUSS_BOT + 8); ctx.lineTo(ro + padW, deckY);
      ctx.stroke();
    }

    // Cable saddle cap at tower top
    if (pe > 0.88) {
      const cp = sub(pe, 0.88, 1.0);
      ctx.globalAlpha = 0.68 * cp; ctx.lineWidth = 1.2;
      const sadW = CW + 6;
      ctx.beginPath();
      ctx.moveTo(tx - sadW, tty + 5); ctx.lineTo(tx - sadW, tty);
      ctx.lineTo(tx + sadW, tty); ctx.lineTo(tx + sadW, tty + 5);
      ctx.stroke();
      // Saddle pin
      ctx.beginPath(); ctx.arc(tx, tty + 2, 3.5, 0, Math.PI * 2); ctx.stroke();
    }

    // Lightning rod on tower top
    if (pe > 0.92) {
      const lp = sub(pe, 0.92, 1.0);
      ctx.globalAlpha = 0.35 * lp; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(tx, tty); ctx.lineTo(tx, tty - 14); ctx.stroke();
      ctx.beginPath(); ctx.arc(tx, tty - 16, 2, 0, Math.PI * 2); ctx.stroke();
    }
  });

  ctx.restore();
}

// ── Tower portal beams + K-bracing ────────────────────────────────────────────
function drawTowerBracing(ctx: CanvasRenderingContext2D, w: number, h: number, p: number) {
  if (p <= 0) return;
  const pe = eo3(p);
  const deckY = DECK_F * h;
  const tty   = TOW_TOP_F * h;
  const towerH = deckY - tty;
  const lx = TOW_LF * w, rx = TOW_RF * w;

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,1)';

  const beamFracs = [0.22, 0.44, 0.65, 0.84]; // fraction of tower height above deck

  [[lx], [rx]].forEach(([tx]) => {
    const lo = tx - LEG_SEP / 2 - CW * 2;
    const ro = tx + LEG_SEP / 2 + CW * 2;
    const li = tx - LEG_SEP / 2;
    const ri = tx + LEG_SEP / 2;

    beamFracs.forEach((hf, bi) => {
      const bp = sub(pe, bi * 0.18, bi * 0.18 + 0.45);
      if (bp <= 0) return;
      const by = deckY - towerH * hf;

      // Outer portal beam
      ctx.globalAlpha = 0.42 * bp; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(lo, by); ctx.lineTo(ro, by); ctx.stroke();

      // Inner portal beam (between inner faces)
      ctx.globalAlpha = 0.20 * bp; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(li, by); ctx.lineTo(ri, by); ctx.stroke();

      // K-brace in the bay below this beam
      const prevY = bi === 0 ? deckY : deckY - towerH * beamFracs[bi - 1];
      const midY  = (by + prevY) / 2;
      if (bp > 0.35) {
        const kp = sub(bp, 0.35, 1.0);
        // Left bay K
        ctx.globalAlpha = 0.22 * kp; ctx.lineWidth = 0.65;
        ctx.beginPath(); ctx.moveTo(lo, prevY); ctx.lineTo(li, midY); ctx.lineTo(lo, by); ctx.stroke();
        // Right bay K
        ctx.beginPath(); ctx.moveTo(ro, prevY); ctx.lineTo(ri, midY); ctx.lineTo(ro, by); ctx.stroke();
        // Mid horizontal connector
        ctx.globalAlpha = 0.15 * kp; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(lo, midY); ctx.lineTo(ro, midY); ctx.stroke();
        // Inner X-brace between legs
        ctx.globalAlpha = 0.10 * kp; ctx.lineWidth = 0.4;
        ctx.beginPath(); ctx.moveTo(li, prevY); ctx.lineTo(ri, by); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ri, prevY); ctx.lineTo(li, by); ctx.stroke();
      }
    });

    // Top bay X-brace (above highest beam)
    if (pe > 0.82) {
      const xp = sub(pe, 0.82, 1.0);
      const topBeamY = deckY - towerH * beamFracs[beamFracs.length - 1];
      ctx.globalAlpha = 0.18 * xp; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(li, topBeamY); ctx.lineTo(ri, tty + 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ri, topBeamY); ctx.lineTo(li, tty + 8); ctx.stroke();
    }

    // Portal plate at deck level (connecting tower base to truss)
    if (pe > 0.30) {
      const pp = sub(pe, 0.30, 0.60);
      ctx.globalAlpha = 0.30 * pp; ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(lo - 4, deckY + TRUSS_TOP - TRUSS_TOP);
      ctx.lineTo(ro + 4, deckY + TRUSS_TOP - TRUSS_TOP);
      ctx.stroke();
    }
  });
  ctx.restore();
}

// ── Main cable (3 parallel strands) ──────────────────────────────────────────
function drawMainCable(ctx: CanvasRenderingContext2D, w: number, h: number, p: number) {
  if (p <= 0) return;
  const pe  = eo3(p);
  const deckY = DECK_F * h;
  const tty   = TOW_TOP_F * h;
  const lx = TOW_LF * w, rx = TOW_RF * w;
  const alx = ANCH_LF * w, arx = ANCH_RF * w;
  const endXF = lerp(ANCH_LF, ANCH_RF, pe);
  const endX  = endXF * w;
  const STEPS = 180;

  function cablePath(offsetY: number) {
    ctx.beginPath();
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      const cx = lerp(alx, endX, t);
      const cxF = cx / w;
      let cy: number;
      if (cxF < TOW_LF) {
        cy = lerp(deckY + 20, tty, c01((cxF - ANCH_LF) / (TOW_LF - ANCH_LF)));
      } else if (cxF > TOW_RF) {
        cy = lerp(tty, deckY + 20, c01((cxF - TOW_RF) / (ANCH_RF - TOW_RF)));
      } else {
        cy = cabY(cxF, w, h);
      }
      cy += offsetY;
      if (i === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
    }
  }

  ctx.save();
  ctx.lineJoin = 'round';

  // Halo
  ctx.lineWidth = 5; ctx.globalAlpha = 0.16 * pe; ctx.strokeStyle = 'rgba(255,255,255,1)';
  cablePath(0); ctx.stroke();

  // Primary strand
  ctx.lineWidth = 2.6; ctx.globalAlpha = 0.96 * pe;
  cablePath(0); ctx.stroke();

  // Secondary strands (suggest bundle of wires)
  ctx.lineWidth = 1.1; ctx.globalAlpha = 0.48 * pe;
  cablePath(-2.5); ctx.stroke();
  cablePath(2.5); ctx.stroke();

  ctx.restore();
}

// ── Cable bands + hangers ─────────────────────────────────────────────────────
function drawHangers(ctx: CanvasRenderingContext2D, w: number, h: number, p: number) {
  if (p <= 0) return;
  const pe = eo5(p);
  const deckY = DECK_F * h;
  const topY  = deckY - TRUSS_TOP;
  const lx = TOW_LF * w, rx = TOW_RF * w;
  const numH = Math.round(HANGER_N * pe);

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,1)';

  for (let i = 0; i < numH; i++) {
    const t    = (i + 1) / (HANGER_N + 1);
    const hxF  = lerp(TOW_LF, TOW_RF, t);
    const hx   = hxF * w;
    const cabTop = cabY(hxF, w, h);

    // Hanger rod
    ctx.globalAlpha = 0.62; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(hx, cabTop + 2); ctx.lineTo(hx, topY); ctx.stroke();

    // Cable band (small rectangle clamped to main cable)
    ctx.globalAlpha = 0.82; ctx.lineWidth = 1.0;
    ctx.strokeRect(hx - 3.5, cabTop - 4, 7, 8);

    // Top clevis connection at truss
    ctx.globalAlpha = 0.68; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(hx - 3, topY); ctx.lineTo(hx + 3, topY); ctx.stroke();

    // Hanger cross-bracing (every 4th pair)
    if (i % 4 === 3 && i + 1 < numH) {
      const t2    = (i + 2) / (HANGER_N + 1);
      const hx2   = lerp(lx, rx, t2);
      const cab2  = cabY(lerp(TOW_LF, TOW_RF, t2), w, h);
      const midY  = (cabTop + topY) / 2;
      const midY2 = (cab2 + topY) / 2;
      ctx.globalAlpha = 0.24; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(hx, midY); ctx.lineTo(hx2, midY2); ctx.stroke();
    }
  }
  ctx.restore();
}

// ── Maintenance walkway + lamp standards ──────────────────────────────────────
function drawDeckFurniture(ctx: CanvasRenderingContext2D, w: number, h: number, p: number) {
  if (p <= 0) return;
  const pe = eo3(p);
  const deckY = DECK_F * h;
  const topY  = deckY - TRUSS_TOP;
  const alx = ANCH_LF * w, arx = ANCH_RF * w;

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,1)';

  // Maintenance walkway (below bottom chord)
  ctx.globalAlpha = 0.12 * pe; ctx.lineWidth = 0.5;
  ctx.setLineDash([4, 6]);
  ctx.beginPath(); ctx.moveTo(alx, deckY + TRUSS_BOT + 10); ctx.lineTo(arx, deckY + TRUSS_BOT + 10); ctx.stroke();
  ctx.setLineDash([]);

  // Inspection trolley track (above top chord)
  ctx.globalAlpha = 0.09 * pe; ctx.lineWidth = 0.4;
  ctx.setLineDash([3, 8]);
  ctx.beginPath(); ctx.moveTo(alx, topY - 10); ctx.lineTo(arx, topY - 10); ctx.stroke();
  ctx.setLineDash([]);

  // Lamp standards along deck
  if (pe > 0.3) {
    const lp = sub(pe, 0.3, 0.75);
    const numL = Math.floor((arx - alx) / 72 * lp);
    ctx.lineWidth = 0.6; ctx.globalAlpha = 0.13 * lp;
    for (let i = 0; i < numL; i++) {
      const lx2 = alx + i * 72;
      ctx.beginPath();
      ctx.moveTo(lx2, deckY);
      ctx.lineTo(lx2, topY - 2);
      ctx.lineTo(lx2 + 10, topY - 2);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(lx2 + 10, topY - 2, 2, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // Survey station marks along deck baseline
  if (pe > 0.55) {
    const sp = sub(pe, 0.55, 0.90);
    ctx.globalAlpha = 0.20 * sp;
    ctx.font = '7px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(200,228,255,1)';
    ctx.textAlign = 'center';
    const stations = [0.20, 0.35, 0.50, 0.65, 0.80];
    stations.forEach((xF, i) => {
      const sx = xF * w;
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(sx, deckY + 2); ctx.lineTo(sx, deckY + 8); ctx.stroke();
      ctx.fillText(`STA ${(i + 1) * 100 + 200}`, sx, deckY + 17);
    });
  }
  ctx.restore();
}

// ── Blueprint dimensions + annotation layer ────────────────────────────────────
function drawAnnotations(ctx: CanvasRenderingContext2D, w: number, h: number, p: number) {
  if (p <= 0) return;
  const pe = eo3(p);
  const deckY = DECK_F * h;
  const tty   = TOW_TOP_F * h;
  const lx = TOW_LF * w, rx = TOW_RF * w;
  const alx = ANCH_LF * w, arx = ANCH_RF * w;

  ctx.save();
  ctx.strokeStyle = 'rgba(200,228,255,1)';
  ctx.fillStyle   = 'rgba(200,228,255,1)';
  ctx.lineJoin = 'miter';

  // ── Main span dimension arrow
  if (pe > 0.04) {
    const dp = sub(pe, 0.04, 0.40);
    const ay  = deckY + 40;
    ctx.globalAlpha = 0.38 * dp; ctx.lineWidth = 0.6;
    ctx.setLineDash([3, 5]);
    ctx.beginPath(); ctx.moveTo(lx, deckY + 8); ctx.lineTo(lx, ay + 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(rx, deckY + 8); ctx.lineTo(rx, ay + 4); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(lx, ay); ctx.lineTo(rx, ay); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lx, ay); ctx.lineTo(lx + 7, ay - 3); ctx.lineTo(lx + 7, ay + 3); ctx.fill();
    ctx.beginPath(); ctx.moveTo(rx, ay); ctx.lineTo(rx - 7, ay - 3); ctx.lineTo(rx - 7, ay + 3); ctx.fill();
    ctx.font = '8px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
    ctx.globalAlpha = 0.44 * dp;
    ctx.fillText('MAIN SPAN: 540m', (lx + rx) / 2, ay - 6);
  }

  // ── Total length dimension
  if (pe > 0.18) {
    const dp = sub(pe, 0.18, 0.52);
    const ay  = deckY + 100;
    ctx.globalAlpha = 0.26 * dp; ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 4]);
    ctx.beginPath(); ctx.moveTo(alx, deckY + 8); ctx.lineTo(alx, ay + 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(arx, deckY + 8); ctx.lineTo(arx, ay + 4); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(alx, ay); ctx.lineTo(arx, ay); ctx.stroke();
    ctx.font = '7px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
    ctx.fillText('TOTAL BRIDGE LENGTH: 1240m', (alx + arx) / 2, ay - 5);
  }

  // ── Approach span dimensions
  if (pe > 0.32) {
    const dp = sub(pe, 0.32, 0.62);
    const ay  = deckY + 36;
    ctx.globalAlpha = 0.22 * dp; ctx.lineWidth = 0.5;
    [[alx, lx], [rx, arx]].forEach(([x0, x1]) => {
      const mid = (x0 + x1) / 2;
      ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(x0, ay); ctx.lineTo(x1, ay); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '7px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
      ctx.fillText('350m', mid, ay - 5);
    });
  }

  // ── Tower height callout (left side)
  if (pe > 0.30) {
    const dp = sub(pe, 0.30, 0.62);
    const ax  = alx - 42;
    ctx.globalAlpha = 0.32 * dp; ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 5]);
    ctx.beginPath(); ctx.moveTo(lx - 44, tty); ctx.lineTo(ax - 4, tty); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lx - 44, deckY); ctx.lineTo(ax - 4, deckY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(ax, tty); ctx.lineTo(ax, deckY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax, tty); ctx.lineTo(ax - 3, tty + 7); ctx.lineTo(ax + 3, tty + 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(ax, deckY); ctx.lineTo(ax - 3, deckY - 7); ctx.lineTo(ax + 3, deckY - 7); ctx.fill();
    ctx.save();
    ctx.translate(ax - 14, (tty + deckY) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = '7px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
    ctx.globalAlpha = 0.38 * dp; ctx.fillStyle = 'rgba(200,228,255,1)';
    ctx.fillText('TOWER HT: 152m', 0, 0);
    ctx.restore();
  }

  // ── Wind load arrow on tower
  if (pe > 0.48) {
    const dp = sub(pe, 0.48, 0.75);
    const tx = rx + LEG_SEP / 2 + CW * 2 + 18;
    const ty = lerp(DECK_F * h, TOW_TOP_F * h, 0.55);
    ctx.globalAlpha = 0.28 * dp; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(tx + 38, ty); ctx.lineTo(tx + 4, ty); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx + 4, ty); ctx.lineTo(tx + 10, ty - 4); ctx.lineTo(tx + 10, ty + 4); ctx.fill();
    ctx.font = '7px "JetBrains Mono", monospace'; ctx.textAlign = 'left';
    ctx.fillText('W = 2.4kPa', tx + 40, ty + 3);
    // Vertical arrow for live load
    const dx = (lx + rx) / 2, dy = DECK_F * h - TRUSS_TOP - 20;
    ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx, dy + 16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(dx, dy + 16); ctx.lineTo(dx - 4, dy + 10); ctx.lineTo(dx + 4, dy + 10); ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillText('LL = 5.0kPa', dx, dy - 4);
  }

  // ── Section cut circles
  if (pe > 0.52) {
    const dp = sub(pe, 0.52, 0.78);
    const cuts = [
      { x: lx, y: DECK_F * h - TRUSS_TOP - 30, lbl: 'A' },
      { x: (lx + rx) / 2, y: DECK_F * h - 30, lbl: 'B' },
      { x: lx, y: lerp(DECK_F * h, TOW_TOP_F * h, 0.5), lbl: 'C' },
    ];
    cuts.forEach(cut => {
      ctx.globalAlpha = 0.38 * dp; ctx.lineWidth = 0.7;
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(cut.x, cut.y, 11, 0, Math.PI * 2); ctx.stroke();
      ctx.font = '8px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
      ctx.globalAlpha = 0.45 * dp;
      ctx.fillText(cut.lbl, cut.x, cut.y + 3);
      ctx.globalAlpha = 0.20 * dp; ctx.lineWidth = 0.4;
      ctx.setLineDash([2, 4]);
      ctx.beginPath(); ctx.moveTo(cut.x, cut.y + 11); ctx.lineTo(cut.x, DECK_F * h - 2); ctx.stroke();
      ctx.setLineDash([]);
    });
  }

  // ── Centerline symbol
  if (pe > 0.62) {
    const dp = sub(pe, 0.62, 0.85);
    const cx  = (lx + rx) / 2;
    ctx.globalAlpha = 0.30 * dp; ctx.lineWidth = 0.6;
    ctx.setLineDash([8, 4, 2, 4]);
    ctx.beginPath(); ctx.moveTo(cx, TOW_TOP_F * h - 18); ctx.lineTo(cx, DECK_F * h + 12); ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '8px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
    ctx.globalAlpha = 0.36 * dp;
    ctx.fillText('CL', cx, TOW_TOP_F * h - 22);
  }

  // ── Waveform domain labels
  if (pe > 0.60) {
    const dp = sub(pe, 0.60, 0.88);
    const anns = [
      { label: '← DIGITAL DOMAIN',   px: lx * 0.46, py: DECK_F * h - 60 },
      { label: 'CONTINUOUS DOMAIN →', px: lerp(rx, ANCH_RF * w, 0.55), py: DECK_F * h - 60 },
      { label: 'DECK / SIGNAL PATH',  px: (lx + rx) / 2, py: DECK_F * h - 8 },
    ];
    anns.forEach((ann, i) => {
      const ap = sub(dp, i * 0.22, i * 0.22 + 0.6);
      if (ap <= 0) return;
      ctx.globalAlpha = ap * 0.44;
      ctx.setLineDash([3, 5]); ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.arc(ann.px, ann.py, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(ann.px - 8, ann.py); ctx.lineTo(ann.px + 8, ann.py);
      ctx.moveTo(ann.px, ann.py - 8); ctx.lineTo(ann.px, ann.py + 8);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '9px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
      ctx.globalAlpha = ap * 0.42;
      ctx.fillText(ann.label, ann.px, ann.py - 18);
    });
  }

  // ── Title block (bottom right)
  if (pe > 0.75) {
    const dp = sub(pe, 0.75, 1.0);
    const bx = w - 210, by = h - 84;

    // Opaque background so waterlines / dimension arrows don't cut through
    ctx.globalAlpha = Math.min(dp * 1.4, 1);
    ctx.fillStyle = 'rgba(8,8,8,1)';
    ctx.fillRect(bx - 1, by - 1, 200, 74);
    ctx.fillStyle = 'rgba(200,228,255,1)'; // restore

    ctx.globalAlpha = 0.62 * dp; ctx.lineWidth = 0.8; ctx.setLineDash([]);
    ctx.strokeRect(bx, by, 198, 72);
    ctx.beginPath(); ctx.moveTo(bx, by + 22); ctx.lineTo(bx + 198, by + 22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx, by + 44); ctx.lineTo(bx + 198, by + 44); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + 104, by + 22); ctx.lineTo(bx + 104, by + 72); ctx.stroke();
    ctx.globalAlpha = 0.88 * dp; ctx.font = '10px "JetBrains Mono", monospace'; ctx.textAlign = 'left';
    ctx.fillText('SIGNAL BRIDGE', bx + 6, by + 15);
    ctx.font = '7px "JetBrains Mono", monospace'; ctx.globalAlpha = 0.68 * dp;
    ctx.fillText('TYPE: SUSPENSION', bx + 6, by + 35);
    ctx.fillText('SCALE: 1:2000', bx + 6, by + 58);
    ctx.fillText('ELEV. +0.000 (MSL)', bx + 108, by + 35);
    ctx.fillText('DWG VX-02  REV.A', bx + 108, by + 58);
    ctx.fillText('DRAWN: VX.WORKS', bx + 6, by + 70);
    ctx.fillText('DATE: 2025-06-13', bx + 108, by + 70);
  }

  // ── Scale bar + north indicator (bottom left)
  if (pe > 0.82) {
    const dp = sub(pe, 0.82, 1.0);
    const sx = 46, sy = h - 42;
    ctx.globalAlpha = 0.36 * dp; ctx.lineWidth = 1; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 128, sy); ctx.stroke();
    [sx, sx + 64, sx + 128].forEach((x, i) => {
      ctx.beginPath(); ctx.moveTo(x, sy - 5); ctx.lineTo(x, sy + 5); ctx.stroke();
    });
    // Filled half
    ctx.globalAlpha = 0.28 * dp;
    ctx.fillStyle = 'rgba(200,228,255,1)';
    ctx.fillRect(sx, sy - 4, 64, 8);
    ctx.font = '7px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
    ctx.globalAlpha = 0.40 * dp;
    ctx.fillStyle = 'rgba(200,228,255,1)';
    ctx.fillText('0', sx, sy - 8);
    ctx.fillText('50m', sx + 64, sy - 8);
    ctx.fillText('100m', sx + 128, sy - 8);
    ctx.fillText('GRAPHICAL SCALE', sx + 64, sy + 16);

    // North arrow
    ctx.globalAlpha = 0.32 * dp; ctx.lineWidth = 0.8;
    ctx.strokeStyle = 'rgba(200,228,255,1)';
    const nx = sx + 176, ny = sy - 2;
    ctx.beginPath(); ctx.moveTo(nx, ny + 14); ctx.lineTo(nx, ny - 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(nx, ny - 14); ctx.lineTo(nx - 5, ny + 2); ctx.lineTo(nx, ny + 4); ctx.lineTo(nx + 5, ny + 2); ctx.closePath(); ctx.stroke();
    ctx.font = '8px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
    ctx.fillText('N', nx, ny - 18);
  }

  ctx.restore();
}

// ── VX. Works watermark — fades in once bridge is fully constructed ───────────
function drawWatermark(ctx: CanvasRenderingContext2D, w: number, h: number, p: number) {
  if (p <= 0) return;
  const pe  = eo3(p);
  const mid = (TOW_TOP_F + DECK_F) / 2; // vertical centre between tower top and deck
  const fs  = Math.min(w * 0.13, 88);
  ctx.save();
  ctx.globalAlpha = pe * 0.052;
  ctx.fillStyle   = 'rgba(200,228,255,1)';
  ctx.font        = `700 ${fs}px 'Space Grotesk', system-ui, sans-serif`;
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VX. WORKS', w / 2, mid * h);
  ctx.restore();
}

// ── Waveform ──────────────────────────────────────────────────────────────────
const WAVE_CYCLES = 3.5;
const WAVE_AMP_F  = 0.052;

function drawWaveform(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  waveP: number, morphP: number,
) {
  if (waveP <= 0.01) return;
  const deckY  = DECK_F * h;
  const amp    = WAVE_AMP_F * h;
  const startX = ANCH_LF * w;
  const span   = (ANCH_RF - ANCH_LF) * w;
  const visLen = span * eo3(waveP);
  const steps  = Math.ceil(visLen);
  if (steps < 2) return;

  ctx.save();
  const layers: { lw: number; a: number }[] = [
    { lw: 9, a: 0.04 }, { lw: 4, a: 0.11 }, { lw: 1.6, a: 0.90 },
  ];
  for (const { lw, a } of layers) {
    ctx.lineWidth = lw; ctx.strokeStyle = `rgba(200,228,255,${a})`; ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t      = i / steps;
      const x      = startX + t * visLen;
      const xSpan  = (x - startX) / span;
      const angle  = xSpan * WAVE_CYCLES * Math.PI * 2;
      const sinVal = Math.sin(angle);
      const sY     = sinVal * amp;
      const sqY    = (sinVal >= 0 ? 1 : -1) * amp;
      const local  = c01(morphP * 1.3 + xSpan * 0.15 - 0.05);
      const y      = deckY - lerp(sqY, sY, eio(local));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// ── Effect: active construction cursor ────────────────────────────────────────
function drawBuildCursor(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, ts: number, alpha: number,
) {
  if (alpha <= 0) return;
  ctx.save();
  const pulse = 0.6 + 0.4 * Math.sin(ts * 0.008);
  ctx.globalAlpha = alpha * pulse;
  ctx.strokeStyle = 'rgba(200,228,255,1)';
  ctx.lineWidth = 0.8;
  // Crosshair arms
  ctx.beginPath();
  ctx.moveTo(x - 10, y); ctx.lineTo(x - 3, y);
  ctx.moveTo(x + 3, y);  ctx.lineTo(x + 10, y);
  ctx.moveTo(x, y - 10); ctx.lineTo(x, y - 3);
  ctx.moveTo(x, y + 3);  ctx.lineTo(x, y + 10);
  ctx.stroke();
  // Rotating square
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ts * 0.0015);
  ctx.strokeRect(-4, -4, 8, 8);
  ctx.restore();
  // Outer pulse ring
  ctx.globalAlpha = alpha * (1 - pulse) * 0.5;
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.arc(x, y, 16 * pulse, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

// ── Effect: scan-line sweep during blueprint reveal ────────────────────────────
function drawScanLine(
  ctx: CanvasRenderingContext2D,
  w: number, h: number, sweepP: number,
) {
  if (sweepP <= 0 || sweepP >= 1) return;
  const y = sweepP * h;
  ctx.save();
  // Glow band
  const grad = ctx.createLinearGradient(0, y - 24, 0, y + 24);
  grad.addColorStop(0,   'rgba(200,228,255,0)');
  grad.addColorStop(0.4, 'rgba(200,228,255,0.06)');
  grad.addColorStop(0.5, 'rgba(200,228,255,0.18)');
  grad.addColorStop(0.6, 'rgba(200,228,255,0.06)');
  grad.addColorStop(1,   'rgba(200,228,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, y - 24, w, 48);
  // Crisp leading edge
  ctx.strokeStyle = 'rgba(200,228,255,0.45)';
  ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  ctx.restore();
}

// ── Effect: cable tension oscillation ─────────────────────────────────────────
function drawCableTension(
  ctx: CanvasRenderingContext2D,
  w: number, h: number, mcP: number, ts: number,
) {
  if (mcP <= 0 || mcP >= 0.55) return;
  const dampen = 1 - mcP / 0.55;       // fades as cable settles
  const amp    = dampen * 5;
  const deckY  = DECK_F * h;
  const tty    = TOW_TOP_F * h;
  const alx    = ANCH_LF * w;
  const endX   = lerp(ANCH_LF, ANCH_RF, eo3(mcP)) * w;
  const STEPS  = 120;
  ctx.save();
  ctx.globalAlpha = 0.22 * dampen;
  ctx.strokeStyle = 'rgba(255,255,255,1)';
  ctx.lineWidth = 1.2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i <= STEPS; i++) {
    const t   = i / STEPS;
    const cx  = lerp(alx, endX, t);
    const cxF = cx / w;
    let cy: number;
    if (cxF < TOW_LF) {
      cy = lerp(deckY + 20, tty, c01((cxF - ANCH_LF) / (TOW_LF - ANCH_LF)));
    } else {
      cy = cabY(cxF, w, h);
    }
    // Oscillation strongest at mid-span, damped at ends
    const spanFrac = (cxF - ANCH_LF) / (ANCH_RF - ANCH_LF);
    const osc = Math.sin(spanFrac * Math.PI * 4 - ts * 0.009) * amp * Math.sin(spanFrac * Math.PI);
    cy += osc;
    if (i === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
  }
  ctx.stroke();
  ctx.restore();
}

// ── Word reveal ───────────────────────────────────────────────────────────────
const WORDS = ['INFRA', '×', 'INTELLIGENCE'] as const;
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ·—/\\|';

function WordReveal({ visible }: { visible: boolean }) {
  const [disp, setDisp] = useState<[string, string, string]>(() => [
    '·'.repeat(5),
    '×',
    '·'.repeat(12),
  ]);
  const [xAccent, setXAccent] = useState(false);
  const timers  = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rafs    = useRef<number[]>([]);
  const shown   = useRef(false); // guards against running reverse on first mount

  useEffect(() => {
    // Cancel any in-flight animations before starting new direction
    timers.current.forEach(clearTimeout);
    rafs.current.forEach(cancelAnimationFrame);
    timers.current = [];
    rafs.current   = [];

    if (visible) {
      shown.current = true;

      // Forward: INFRA → × → INTELLIGENCE
      const fwd = [
        { word: 'INFRA',        wi: 0 as const, delayMs: 0,   durationMs: 580 },
        { word: '×',            wi: 1 as const, delayMs: 300, durationMs: 0   },
        { word: 'INTELLIGENCE', wi: 2 as const, delayMs: 480, durationMs: 950 },
      ];
      fwd.forEach(({ word, wi, delayMs, durationMs }) => {
        timers.current[wi] = setTimeout(() => {
          if (wi === 1) {
            setXAccent(true);
            timers.current[4] = setTimeout(() => setXAccent(false), 700);
            return;
          }
          const letters = word.split('');
          const start = performance.now();
          const tick = () => {
            const t = Math.min(1, (performance.now() - start) / durationMs);
            const str = letters.map((ch, ci) => {
              if (t >= (ci + 1) / letters.length) return ch;
              if (t >  ci      / letters.length) return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
              return '·';
            }).join('');
            setDisp(prev => { const n = [...prev] as [string,string,string]; n[wi] = str; return n; });
            if (t < 1) rafs.current[wi] = requestAnimationFrame(tick);
          };
          rafs.current[wi] = requestAnimationFrame(tick);
        }, delayMs);
      });

    } else if (shown.current) {
      // Reverse: INTELLIGENCE → × → INFRA (right-to-left dissolve, reverse stagger)
      const rev = [
        { word: 'INTELLIGENCE', wi: 2 as const, delayMs: 0,   durationMs: 600 },
        { word: '×',            wi: 1 as const, delayMs: 200, durationMs: 0   },
        { word: 'INFRA',        wi: 0 as const, delayMs: 320, durationMs: 380 },
      ];
      rev.forEach(({ word, wi, delayMs, durationMs }) => {
        timers.current[wi] = setTimeout(() => {
          if (wi === 1) {
            setXAccent(false);
            return;
          }
          const letters = word.split('');
          const n = letters.length;
          const start = performance.now();
          const tick = () => {
            const t = Math.min(1, (performance.now() - start) / durationMs);
            // Dissolve right-to-left: last char first
            const str = letters.map((ch, ci) => {
              const dissolveStart = (n - 1 - ci) / n;
              const dissolveEnd   = (n     - ci) / n;
              if (t >= dissolveEnd)   return '·';
              if (t >  dissolveStart) return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
              return ch;
            }).join('');
            setDisp(prev => { const nx = [...prev] as [string,string,string]; nx[wi] = str; return nx; });
            if (t < 1) rafs.current[wi] = requestAnimationFrame(tick);
            else setDisp(prev => { const nx = [...prev] as [string,string,string]; nx[wi] = '·'.repeat(word.length); return nx; });
          };
          rafs.current[wi] = requestAnimationFrame(tick);
        }, delayMs);
      });
    }

    return () => {
      timers.current.forEach(clearTimeout);
      rafs.current.forEach(cancelAnimationFrame);
    };
  }, [visible]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div
        aria-label="Infra meets Intelligence"
        style={{
          display: 'flex', flexWrap: 'wrap',
          gap: 'clamp(8px,1.2vw,20px)', alignItems: 'baseline',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.08s ease',
        }}
      >
        {WORDS.map((word, i) => (
          <span key={i} style={{
            display: 'inline-block',
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: word === '×' ? 'clamp(36px,5vw,72px)' : 'clamp(44px,6.5vw,96px)',
            fontWeight: 700,
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
            color: (i === 1 && xAccent)
              ? 'var(--accent)'
              : (word === '×' ? 'var(--text-tertiary)' : 'var(--text-primary)'),
            transition: i === 1 ? 'color 0.5s ease' : undefined,
          }}>
            {disp[i]}
          </span>
        ))}
      </div>
      {/* Sweep line drawn underneath as words resolve */}
      <div style={{
        height: '1px',
        background: 'var(--border-active)',
        width: visible ? '100%' : '0%',
        transition: visible ? 'width 1.5s cubic-bezier(0.16,1,0.3,1) 0.12s' : 'none',
        marginTop: 'clamp(10px,1.5vh,18px)',
      }} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BridgeOscilloscope() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const progRef    = useRef(0);
  const animId     = useRef(0);
  const reduced    = useRef(false);
  const boxRef     = useRef<HTMLDivElement>(null);
  const [wordsVisible, setWordsVisible] = useState(false);

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const section = sectionRef.current;
    const canvas  = canvasRef.current;
    if (!section || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width  = Math.round(canvas!.offsetWidth  * dpr);
      canvas!.height = Math.round(canvas!.offsetHeight * dpr);
      ctx!.scale(dpr, dpr);
    }
    const ro = new ResizeObserver(resize);
    ro.observe(canvas); resize();

    function onScroll() {
      const rect = section!.getBoundingClientRect();
      const scrollable = section!.offsetHeight - window.innerHeight;
      if (scrollable <= 0) { progRef.current = 0; return; }
      progRef.current = c01(-rect.top / scrollable);
      // Pin: drive canvas scale 1.35→1.0 as bridge finishes (76–88% of scroll)
      if (boxRef.current && !reduced.current) {
        const pinP  = c01((progRef.current - 0.76) / (0.88 - 0.76));
        const scale = lerp(1.35, 1.00, eio(pinP));
        boxRef.current.style.transform = `scale(${scale})`;
      }
      // Toggle words reveal — bidirectional so scrolling back hides them
      setWordsVisible(progRef.current > 0.88);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // For reduced motion: reveal words as soon as section is in view
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && reduced.current) setWordsVisible(true);
    }, { threshold: 0.06 });
    io.observe(section);

    function draw(ts: number) {
      animId.current = requestAnimationFrame(draw);
      const w = canvas!.offsetWidth, h = canvas!.offsetHeight;
      if (w === 0 || h === 0) return;
      ctx!.clearRect(0, 0, w, h);

      const prog = reduced.current ? 1 : progRef.current;
      // Bridge builds during 0–76% of scroll; 76–88% = pin shrink; 88–100% = signal
      const bridgeProg = reduced.current ? 1 : c01(prog / 0.76);

      // ── Cinematic phase timing (each scene budgeted within bridgeProg) ──────
      // Scene 1 "Establish" — fast cold open
      const gridP = sub(bridgeProg, 0.00, 0.10);
      const gP    = sub(bridgeProg, 0.00, 0.07);
      const sfP   = sub(bridgeProg, 0.02, 0.08);
      const wlP   = sub(bridgeProg, 0.05, 0.09);
      // Scene 2 "Foundation"
      const fdP   = sub(bridgeProg, 0.07, 0.19);
      const apP   = sub(bridgeProg, 0.14, 0.24);
      const dtP   = sub(bridgeProg, 0.19, 0.30);
      // Scene 3 "Towers Rise" — 26% of bridge budget
      const tP    = sub(bridgeProg, 0.26, 0.52);
      const brP   = sub(bridgeProg, 0.40, 0.56);
      // Scene 4 "Cable Pull" — 19% of bridge budget
      const mcP   = sub(bridgeProg, 0.48, 0.67);
      // Scene 5 "Final Assembly"
      const hP    = sub(bridgeProg, 0.62, 0.76);
      const dfP   = sub(bridgeProg, 0.70, 0.80);
      // Scene 6 "Blueprint" — annotations cascade through to bridgeProg=1
      const anP   = sub(bridgeProg, 0.74, 0.96);
      const wmP   = sub(bridgeProg, 0.76, 0.96); // watermark fades in with annotation layer
      // Scene 7+8 "Signal" — after pin completes (prog > 0.88)
      const waveP  = sub(prog, 0.89, 0.96);
      const morphP = sub(prog, 0.93, 1.00);

      // ── Draw all layers ───────────────────────────────────────────────────
      drawGrid(ctx!, w, h, gridP);
      drawElevAxis(ctx!, w, h, gP);
      drawSeafloor(ctx!, w, h, sfP);
      drawWaterlines(ctx!, w, h, wlP);
      drawFoundations(ctx!, w, h, fdP);
      drawApproachSpans(ctx!, w, h, apP);
      drawDeckTruss(ctx!, w, h, dtP);
      drawTowers(ctx!, w, h, tP);
      drawTowerBracing(ctx!, w, h, brP);
      drawMainCable(ctx!, w, h, mcP);
      drawCableTension(ctx!, w, h, mcP, ts);
      drawHangers(ctx!, w, h, hP);
      drawDeckFurniture(ctx!, w, h, dfP);
      drawWatermark(ctx!, w, h, wmP);
      drawAnnotations(ctx!, w, h, anP);
      drawWaveform(ctx!, w, h, waveP, morphP);

      // ── Scan line: sweeps during blueprint reveal (bridge-local timing) ─────
      if (!reduced.current) {
        const sweepP = sub(bridgeProg, 0.74, 0.96);
        drawScanLine(ctx!, w, h, sweepP);
      }

      // ── Build cursor: tracks active construction frontier ─────────────────
      if (!reduced.current) {
        const deckY = DECK_F * h;
        const tty   = TOW_TOP_F * h;
        const lx    = TOW_LF * w;
        // Determine which phase is "hot" and where the frontier is
        let cx = -1, cy = -1, ca = 0;
        if (mcP > 0.01 && mcP < 0.99) {
          // Cable tip
          const tipXF = lerp(ANCH_LF, ANCH_RF, eo3(mcP));
          cx = tipXF * w;
          cy = tipXF < TOW_RF ? cabY(tipXF, w, h) : cabY(TOW_RF, w, h);
          ca = Math.min(mcP * 4, 1) * Math.min((1 - mcP) * 4, 1);
        } else if (tP > 0.01 && tP < 0.99) {
          // Tower top as it rises
          cx = lx;
          cy = lerp(deckY, tty, eo3(tP));
          ca = Math.min(tP * 5, 1) * Math.min((1 - tP) * 5, 1);
        } else if (dtP > 0.01 && dtP < 0.99) {
          // Deck right edge
          cx = lerp(ANCH_LF * w, ANCH_RF * w, eo3(dtP));
          cy = deckY;
          ca = Math.min(dtP * 5, 1) * Math.min((1 - dtP) * 5, 1);
        }
        if (ca > 0) drawBuildCursor(ctx!, cx, cy, ts, ca * 0.75);
      }
    }
    animId.current = requestAnimationFrame(draw);
    if (reduced.current) setWordsVisible(true);

    return () => {
      cancelAnimationFrame(animId.current);
      ro.disconnect(); io.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const CORNER_SIZE = 18; // px — L-bracket arm length
  const cornerStyle = (pos: 'tl'|'tr'|'bl'|'br'): React.CSSProperties => ({
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    [pos[0] === 't' ? 'top' : 'bottom']: -1,
    [pos[1] === 'l' ? 'left' : 'right']: -1,
    borderTop:    pos[0] === 't' ? '1px solid var(--border-active)' : undefined,
    borderBottom: pos[0] === 'b' ? '1px solid var(--border-active)' : undefined,
    borderLeft:   pos[1] === 'l' ? '1px solid var(--border-active)' : undefined,
    borderRight:  pos[1] === 'r' ? '1px solid var(--border-active)' : undefined,
    pointerEvents: 'none',
    zIndex: 3,
  });

  return (
    <section
      id="transition"
      ref={sectionRef}
      aria-labelledby="bridge-heading"
      style={{ position: 'relative', height: '850vh', borderTop: '1px solid var(--border-rest)', overflowX: 'clip' }}
    >
      {/* Sticky viewport */}
      <div style={{
        position: 'sticky', top: 0, height: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 'clamp(16px, 2.5vh, 28px)',
        background: 'var(--bg-base)',
        paddingInline: 'var(--margin-safe-area)',
        paddingTop: 'clamp(88px, 11vh, 120px)',
        overflowX: 'clip',
      }}>
        {/* Section label — outside the box, top-left of viewport */}
        <div style={{
          position: 'absolute', top: 'var(--margin-safe-area)', left: 'var(--margin-safe-area)',
          display: 'flex', alignItems: 'center', gap: '16px', zIndex: 2,
        }}>
          <p className="text-mono" style={{ color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
            02 / BRIDGE
          </p>
        </div>

        {/* Framed canvas box — starts at 1.35× scale, shrinks to 1× during pin */}
        <div ref={boxRef} style={{
          position: 'relative',
          width: 'clamp(560px, 88vw, 1320px)',
          height: 'clamp(320px, 62vh, 640px)',
          border: '1px solid var(--border-rest)',
          background: 'var(--bg-base)',
          flexShrink: 0,
          transform: 'scale(1.35)',
          transformOrigin: 'center 30%',
          willChange: 'transform',
        }}>
          {/* Corner L-brackets */}
          {(['tl','tr','bl','br'] as const).map(pos => (
            <div key={pos} aria-hidden="true" style={cornerStyle(pos)} />
          ))}

          {/* Header bar inside box */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: '26px',
            borderBottom: '1px solid var(--border-rest)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingInline: '10px',
            zIndex: 2, pointerEvents: 'none',
          }}>
            <span className="text-mono" style={{ color: 'var(--text-tertiary)', fontSize: '9px', letterSpacing: '0.14em' }}>
              ELEVATION DRAWING · SIGNAL BRIDGE
            </span>
            <span className="text-mono" style={{ color: 'var(--text-tertiary)', fontSize: '9px', letterSpacing: '0.14em' }}>
              DWG VX-02 · REV.A
            </span>
          </div>

          {/* Canvas — fills box below header */}
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '26px', left: 0, right: 0, bottom: 0,
              width: '100%', height: 'calc(100% - 26px)',
              display: 'block',
            }}
          />

          {/* Scroll hint — inside box bottom-right */}
          <p className="text-mono" style={{
            position: 'absolute', bottom: '8px', right: '10px',
            color: 'var(--text-tertiary)', zIndex: 2, pointerEvents: 'none',
            fontSize: '9px', letterSpacing: '0.14em',
          }}>SCROLL ↓</p>
        </div>

        {/* Word reveal — below the box */}
        <div style={{ width: 'clamp(560px, 88vw, 1320px)', zIndex: 2 }}>
          <h2 id="bridge-heading" className="sr-only">Infra meets Intelligence</h2>
          <WordReveal visible={wordsVisible} />
        </div>
      </div>
    </section>
  );
}
