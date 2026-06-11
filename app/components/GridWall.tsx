'use client';

import { useEffect, useRef } from 'react';

interface Cell {
  x: number;
  y: number;
  brightness: number;
  targetBrightness: number;
}

const CELL_SIZE_DESKTOP = 28;
const CELL_SIZE_MOBILE = 20;
const GAP = 6;
const RADIUS = 6;
const FALLOFF_RADIUS = 180;
const LERP_FACTOR = 0.15;
const PEAK_BORDER_OPACITY = 0.65;
const REST_BORDER_OPACITY = 0.12;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function GridWall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cellsRef = useRef<Cell[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isMobile = () => window.innerWidth < 768;
    let cellSize = isMobile() ? CELL_SIZE_MOBILE : CELL_SIZE_DESKTOP;
    const step = () => cellSize + GAP;

    function buildGrid() {
      if (!canvas) return;
      cellSize = isMobile() ? CELL_SIZE_MOBILE : CELL_SIZE_DESKTOP;
      const cols = Math.ceil(canvas.width / step()) + 1;
      const rows = Math.ceil(canvas.height / step()) + 1;
      cellsRef.current = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          cellsRef.current.push({
            x: c * step(),
            y: r * step(),
            brightness: 0,
            targetBrightness: 0,
          });
        }
      }
    }

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      buildGrid();
    }

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const isReduced = reducedMotion.current;
      const isTouchDevice = !window.matchMedia('(hover: hover)').matches;

      for (const cell of cellsRef.current) {
        if (!isReduced && !isTouchDevice) {
          const dx = cell.x + cellSize / 2 - mx;
          const dy = cell.y + cellSize / 2 - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const t = Math.max(0, 1 - dist / FALLOFF_RADIUS);
          cell.targetBrightness = easeInOutCubic(t);
          cell.brightness = lerp(cell.brightness, cell.targetBrightness, LERP_FACTOR);
        } else {
          cell.brightness = 0;
        }

        const opacity = lerp(REST_BORDER_OPACITY, PEAK_BORDER_OPACITY, cell.brightness);

        ctx.beginPath();
        ctx.roundRect(cell.x, cell.y, cellSize, cellSize, RADIUS);

        if (cell.brightness > 0.01) {
          ctx.fillStyle = `rgba(255,255,255,${0.06 * cell.brightness})`;
          ctx.fill();
        }

        ctx.strokeStyle = `rgba(255,255,255,${opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      // If canvas is fully off-screen, suppress glow
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        mouseRef.current = { x: -9999, y: -9999 };
        return;
      }
      // Convert to canvas-local coordinates
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function onMouseLeave() {
      mouseRef.current = { x: -9999, y: -9999 };
    }

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    document.documentElement.addEventListener('mouseleave', onMouseLeave);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
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
