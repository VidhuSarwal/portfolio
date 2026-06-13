'use client';

import { useEffect, useRef } from 'react';
import { useLoader } from '@/app/providers/LoaderContext';

// ── Grid cross-mark constants ─────────────────────────────────────────────────
const STEP_DESKTOP   = 36;
const STEP_MOBILE    = 28;
const ARM_BASE       = 4;
const ARM_PEAK       = 9;
const FALLOFF_RADIUS = 200;
const LERP_FACTOR    = 0.15;
const REST_OPACITY   = 0.20;
const PEAK_OPACITY   = 0.72;
const EDGE_FADE_ZONE = 0.16;

// ── Sparkle constants ─────────────────────────────────────────────────────────
const MAX_SPARKLES    = 12;
// Sparkles start 3s after loader done (credentials are wrapping up by then)
const SPARKLE_DELAY   = 3000;
// Spawn 1–3 sparkles every 0.5–1.4s
const nextSpawnDelay  = () => 500 + Math.random() * 900;

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }

interface CrossPoint { x: number; y: number; brightness: number; }

interface Sparkle {
  x: number;        // pixel position (snapped to grid intersection)
  y: number;
  progress: number; // 0 → 1 over full lifetime
  speed: number;    // progress increment per frame
  mainLen: number;  // max arm length (px) for cardinal arms
  diagLen: number;  // max arm length for diagonal arms
  isAccent: boolean; // false = white, true = accent ice-blue
}

// ── Theme color pairs (dark → light) ─────────────────────────────────────────
const CROSS_DARK:    [number,number,number] = [255, 255, 255];
const CROSS_LIGHT:   [number,number,number] = [28,  26,  23];
const SPARK_DARK:    [number,number,number] = [200, 228, 255];
const SPARK_LIGHT:   [number,number,number] = [44,  82,  130];
const SPARK2_DARK:   [number,number,number] = [230, 244, 255];
const SPARK2_LIGHT:  [number,number,number] = [80,  110, 160];
const DOT_DARK:      [number,number,number] = [245, 252, 255];
const DOT_LIGHT:     [number,number,number] = [44,  82,  130];

function mixRGB(a: [number,number,number], b: [number,number,number], t: number): string {
  return `${Math.round(a[0]+(b[0]-a[0])*t)},${Math.round(a[1]+(b[1]-a[1])*t)},${Math.round(a[2]+(b[2]-a[2])*t)}`;
}

export default function GridWall() {
  const { isDone } = useLoader();
  const isDoneRef  = useRef(false);

  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const pointsRef  = useRef<CrossPoint[]>([]);
  const mouseRef   = useRef({ x: -9999, y: -9999 });
  const rafRef     = useRef<number>(0);
  const reducedRef = useRef(false);
  const inViewRef  = useRef(false);
  // 0 = fully dark, 1 = fully light — lerped each frame
  const themeTRef  = useRef(0);

  const sparklesRef     = useRef<Sparkle[]>([]);
  const colsRef         = useRef(0);
  const rowsRef         = useRef(0);
  const stepRef         = useRef(STEP_DESKTOP);
  const lastSpawnRef    = useRef(0);
  const nextIntervalRef = useRef(0);
  const canSpawnRef     = useRef(false);

  useEffect(() => { isDoneRef.current = isDone; }, [isDone]);

  useEffect(() => {
    if (!isDone) return;
    const t = setTimeout(() => { canSpawnRef.current = true; }, SPARKLE_DELAY);
    return () => clearTimeout(t);
  }, [isDone]);

  useEffect(() => {
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const c: CanvasRenderingContext2D = ctx;

    const visObs = new IntersectionObserver(
      ([e]) => { inViewRef.current = e.isIntersecting; },
      { threshold: 0.05 }
    );
    visObs.observe(canvas);

    const isMobile = () => window.innerWidth < 768;

    function buildGrid() {
      if (!canvas) return;
      const step = isMobile() ? STEP_MOBILE : STEP_DESKTOP;
      stepRef.current = step;
      const cols = Math.ceil(canvas.width  / step);
      const rows = Math.ceil(canvas.height / step);
      colsRef.current = cols;
      rowsRef.current = rows;
      pointsRef.current = [];
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          pointsRef.current.push({ x: c * step, y: r * step, brightness: 0 });
        }
      }
      sparklesRef.current = [];
    }

    function resize() {
      if (!canvas) return;
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      buildGrid();
    }

    function spawnBurst(ts: number) {
      const cols = colsRef.current;
      const rows = rowsRef.current;
      const step = stepRef.current;
      const mg   = 2; // margin from edges (in grid cells)
      if (cols < mg * 2 + 1 || rows < mg * 2 + 1) return;

      // Spawn 1–3 sparkles per burst event
      const count = 1 + (Math.random() < 0.45 ? 1 : 0) + (Math.random() < 0.18 ? 1 : 0);
      for (let i = 0; i < count; i++) {
        if (sparklesRef.current.length >= MAX_SPARKLES) break;
        const c = mg + Math.floor(Math.random() * (cols - mg * 2));
        const r = mg + Math.floor(Math.random() * (rows - mg * 2));
        const mainLen = 12 + Math.random() * 10; // 12–22px — short, sharp
        sparklesRef.current.push({
          x: c * step,
          y: r * step,
          progress: 0,
          // Lifetime: 0.9–1.5 seconds at 60fps
          speed: 1 / ((54 + Math.random() * 36) * 1),
          mainLen,
          diagLen: 0,
          isAccent: Math.random() < 0.35,
        });
      }

      lastSpawnRef.current    = ts;
      nextIntervalRef.current = nextSpawnDelay();
    }

    function drawSparkle(s: Sparkle, themeT: number) {
      const { x, y, progress, mainLen, isAccent } = s;
      if (mainLen < 1) return;

      const expandEnd = 0.20;
      const holdEnd   = 0.50;
      const expandT   = Math.min(progress / expandEnd, 1);
      const armFrac   = easeOutCubic(expandT);

      let opacity: number;
      if (progress < expandEnd) {
        opacity = progress / expandEnd;
      } else if (progress < holdEnd) {
        opacity = 1;
      } else {
        opacity = 1 - (progress - holdEnd) / (1 - holdEnd);
      }
      opacity = Math.max(0, opacity);
      if (opacity < 0.01) return;

      const curMainLen = mainLen * armFrac;

      const core = isAccent
        ? mixRGB(SPARK_DARK,  SPARK_LIGHT,  themeT)
        : mixRGB(SPARK2_DARK, SPARK2_LIGHT, themeT);
      const dot  = mixRGB(DOT_DARK, DOT_LIGHT, themeT);

      c.save();
      c.lineWidth = 1.0;

      // Sharp cardinal cross — solid color, no gradient
      const cardinalDirs = [[0,-1],[0,1],[1,0],[-1,0]];
      for (const [dx, dy] of cardinalDirs) {
        const tx = x + dx * curMainLen;
        const ty = y + dy * curMainLen;
        if (Math.abs(tx - x) < 0.5 && Math.abs(ty - y) < 0.5) continue;
        c.beginPath(); c.moveTo(x, y); c.lineTo(tx, ty);
        c.strokeStyle = `rgba(${core},${opacity * 0.80})`;
        c.stroke();
      }

      // Center dot
      c.beginPath();
      c.arc(x, y, 1.5, 0, Math.PI * 2);
      c.fillStyle = `rgba(${dot},${opacity})`;
      c.fill();

      c.restore();
    }

    function drawSparkles(themeT: number) {
      const alive: Sparkle[] = [];
      for (const s of sparklesRef.current) {
        s.progress += s.speed;
        if (s.progress < 1) {
          drawSparkle(s, themeT);
          alive.push(s);
        }
      }
      sparklesRef.current = alive;
    }

    function draw(ts: number) {
      if (!canvas || !ctx) return;

      if (!reducedRef.current && inViewRef.current && canSpawnRef.current) {
        if (ts - lastSpawnRef.current > nextIntervalRef.current &&
            sparklesRef.current.length < MAX_SPARKLES) {
          spawnBurst(ts);
        }
      }

      // ── Lerp theme toward current data-theme (matches ~500ms CSS transition) ─
      const targetT = document.documentElement.getAttribute('data-theme') === 'light' ? 1 : 0;
      themeTRef.current = lerp(themeTRef.current, targetT, 0.07);
      const themeT = themeTRef.current;

      c.clearRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const isReduced = reducedRef.current;
      const isTouch   = !window.matchMedia('(hover: hover)').matches;
      const W = canvas.width;
      const H = canvas.height;
      const crossRGB = mixRGB(CROSS_DARK, CROSS_LIGHT, themeT);

      // ── Cross marks ──────────────────────────────────────────────────────────
      for (const pt of pointsRef.current) {
        const ex = Math.min(pt.x / (W * EDGE_FADE_ZONE), (W - pt.x) / (W * EDGE_FADE_ZONE));
        const ey = Math.min(pt.y / (H * EDGE_FADE_ZONE), (H - pt.y) / (H * EDGE_FADE_ZONE));
        const edgeFade = Math.min(1, ex) * Math.min(1, ey);
        if (edgeFade <= 0.01) continue;

        if (!isReduced && !isTouch) {
          const dx = pt.x - mx;
          const dy = pt.y - my;
          const dist = Math.sqrt(dx*dx + dy*dy);
          pt.brightness = lerp(
            pt.brightness,
            easeInOutCubic(Math.max(0, 1 - dist / FALLOFF_RADIUS)),
            LERP_FACTOR
          );
        } else {
          pt.brightness = 0;
        }

        const opacity = lerp(REST_OPACITY, PEAK_OPACITY, pt.brightness) * edgeFade;
        if (opacity < 0.01) continue;
        const arm = lerp(ARM_BASE, ARM_PEAK, pt.brightness);
        c.lineWidth = 1;
        c.strokeStyle = `rgba(${crossRGB},${opacity})`;
        c.beginPath();
        c.moveTo(pt.x - arm, pt.y); c.lineTo(pt.x + arm, pt.y);
        c.moveTo(pt.x, pt.y - arm); c.lineTo(pt.x, pt.y + arm);
        c.stroke();
      }

      // ── Sparkles on top ───────────────────────────────────────────────────────
      if (!isReduced && inViewRef.current) {
        drawSparkles(themeT);
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    function onMouseMove(e: MouseEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        mouseRef.current = { x: -9999, y: -9999 }; return;
      }
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function onMouseLeave() { mouseRef.current = { x: -9999, y: -9999 }; }

    resize();

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    document.documentElement.addEventListener('mouseleave', onMouseLeave);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      visObs.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      document.documentElement.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  );
}
