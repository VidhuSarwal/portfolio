'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { siteConfig } from '@/lib/config';

// ── Types ─────────────────────────────────────────────────────────────────────
type NodeSize   = 'XL' | 'L' | 'M' | 'S';
type ClusterId  = 'systems' | 'backend' | 'ai' | 'infra' | 'center';
type EdgeWeight = 'strong' | 'medium' | 'weak';

interface NodeDef {
  id: string; label: string; cluster: ClusterId; size: NodeSize;
  depth: number; phase: number;
  pos: { x: number; y: number };
  period: string; usedIn: (samsung: boolean) => string;
}

interface EdgeDef { a: string; b: string; weight: EdgeWeight; }

interface PulseState {
  fromId: string; toId: string; prevFromId: string | null;
  rawT: number; paused: boolean; pauseUntil: number;
  opacity: number; retired: boolean;
}

interface AmbientPulse { nodeId: string; t: number; }

function easeInOutSine(t: number) { return -(Math.cos(Math.PI * t) - 1) / 2; }

// ── Size maps ─────────────────────────────────────────────────────────────────
const NODE_R:  Record<NodeSize, number> = { XL: 14, L: 11, M: 8, S: 6 };
const NODE_FS: Record<NodeSize, number> = { XL: 13, L: 12, M: 11, S: 10 };

// ── Edge weight visual maps ───────────────────────────────────────────────────
const EDGE_OPACITY: Record<EdgeWeight, number> = { strong: 0.14, medium: 0.08, weak: 0.045 };
const EDGE_WIDTH:   Record<EdgeWeight, number> = { strong: 1.0,  medium: 0.7,  weak: 0.5   };

// ── 22-node catalog ──────────────────────────────────────────────────────────
const NODES: NodeDef[] = [
  // SYSTEMS — left spine
  { id:'linux',      label:'Linux Kernel', cluster:'systems', size:'L',  depth:0.20, phase:0.0, pos:{x:0.17, y:0.38}, period:'Systems · 2024–', usedIn:()=>"GSoC '25, LKMP" },
  { id:'c',          label:'C',            cluster:'systems', size:'L',  depth:0.15, phase:1.2, pos:{x:0.30, y:0.47}, period:'Systems · 2024–', usedIn:()=>"GSoC '25, ESP32" },
  { id:'cpp',        label:'C++',          cluster:'systems', size:'M',  depth:0.40, phase:0.7, pos:{x:0.23, y:0.42}, period:'Systems · 2024–', usedIn:()=>"GSoC '25" },
  { id:'embedded',   label:'Embedded C',   cluster:'systems', size:'M',  depth:0.50, phase:2.1, pos:{x:0.14, y:0.60}, period:'Systems · 2024–', usedIn:()=>"ESP32, Sentinal" },
  { id:'arm',        label:'ARM',          cluster:'systems', size:'S',  depth:0.70, phase:1.8, pos:{x:0.06, y:0.46}, period:'Systems · 2024–', usedIn:()=>"GSoC '25" },
  { id:'buildroot',  label:'Buildroot',    cluster:'systems', size:'S',  depth:0.80, phase:3.2, pos:{x:0.05, y:0.68}, period:'Systems · 2024–', usedIn:()=>"GSoC '25" },
  // BACKEND — center band
  { id:'python',     label:'Python',       cluster:'backend', size:'XL', depth:0.10, phase:0.5, pos:{x:0.57, y:0.26}, period:'Backend · 2023–', usedIn:(s)=>s?"Samsung PRISM, GitScope, more":"GitScope, VaultCrypt, more" },
  { id:'go',         label:'Go',           cluster:'backend', size:'L',  depth:0.20, phase:1.5, pos:{x:0.74, y:0.18}, period:'Backend · 2024–', usedIn:()=>"VaultCrypt" },
  { id:'typescript', label:'TypeScript',   cluster:'backend', size:'M',  depth:0.45, phase:2.8, pos:{x:0.50, y:0.12}, period:'Backend · 2024–', usedIn:(s)=>s?"Samsung PRISM":"This portfolio" },
  { id:'fastapi',    label:'FastAPI',      cluster:'backend', size:'M',  depth:0.35, phase:0.3, pos:{x:0.64, y:0.50}, period:'Backend · 2024–', usedIn:(s)=>s?"Samsung PRISM, GitScope":"GitScope" },
  { id:'async',      label:'async',        cluster:'backend', size:'S',  depth:0.60, phase:1.1, pos:{x:0.52, y:0.63}, period:'Backend · 2024–', usedIn:(s)=>s?"Samsung PRISM, GitScope":"GitScope" },
  { id:'websockets', label:'WebSockets',   cluster:'backend', size:'S',  depth:0.75, phase:2.4, pos:{x:0.68, y:0.72}, period:'Backend · 2024–', usedIn:(s)=>s?"Samsung PRISM":"Streaming services" },
  // AI / ML — right arc
  { id:'langgraph',  label:'LangGraph',    cluster:'ai',      size:'L',  depth:0.25, phase:1.6, pos:{x:0.82, y:0.38}, period:'AI/ML · 2024–',   usedIn:(s)=>s?"Samsung PRISM":"Worklet Generator Agent" },
  { id:'rag',        label:'RAG',          cluster:'ai',      size:'M',  depth:0.40, phase:0.9, pos:{x:0.83, y:0.56}, period:'AI/ML · 2024–',   usedIn:(s)=>s?"Samsung PRISM":"GitScope" },
  { id:'chromadb',   label:'ChromaDB',     cluster:'ai',      size:'M',  depth:0.50, phase:2.0, pos:{x:0.91, y:0.26}, period:'AI/ML · 2024–',   usedIn:(s)=>s?"Samsung PRISM, GitScope":"GitScope" },
  { id:'embeddings', label:'Embeddings',   cluster:'ai',      size:'S',  depth:0.70, phase:3.0, pos:{x:0.88, y:0.68}, period:'AI/ML · 2024–',   usedIn:(s)=>s?"GitScope, Samsung PRISM":"GitScope" },
  { id:'treesitter', label:'Tree-sitter',  cluster:'ai',      size:'S',  depth:0.80, phase:1.3, pos:{x:0.77, y:0.80}, period:'AI/ML · 2024–',   usedIn:()=>"GitScope" },
  // INFRA — lower band
  { id:'docker',     label:'Docker',       cluster:'infra',   size:'M',  depth:0.35, phase:0.6, pos:{x:0.38, y:0.81}, period:'Infra · 2023–',   usedIn:()=>"Most deploys" },
  { id:'kubernetes', label:'Kubernetes',   cluster:'infra',   size:'S',  depth:0.65, phase:2.6, pos:{x:0.52, y:0.90}, period:'Infra · 2024',    usedIn:()=>"Familiar" },
  { id:'postgres',   label:'PostgreSQL',   cluster:'infra',   size:'S',  depth:0.70, phase:1.9, pos:{x:0.23, y:0.87}, period:'Infra · 2024–',   usedIn:()=>"Backend services" },
  { id:'mongodb',    label:'MongoDB',      cluster:'infra',   size:'S',  depth:0.75, phase:3.5, pos:{x:0.10, y:0.78}, period:'Infra · 2024–',   usedIn:()=>"VaultCrypt" },
  // CENTER — bridge node
  { id:'git',        label:'Git',          cluster:'center',  size:'M',  depth:0.10, phase:4.0, pos:{x:0.44, y:0.50}, period:'Universal',        usedIn:()=>"Every project" },
];

// ── 22-edge curated graph ─────────────────────────────────────────────────────
// Removed from original 30: typescript↔websockets, python↔go, chromadb↔embeddings,
// langgraph↔embeddings, docker↔postgres, git↔linux, git↔go, postgres↔fastapi
const EDGES: EdgeDef[] = [
  { a:'linux',     b:'c',          weight:'strong' },
  { a:'linux',     b:'arm',        weight:'medium' },
  { a:'linux',     b:'buildroot',  weight:'medium' },
  { a:'c',         b:'cpp',        weight:'strong' },
  { a:'c',         b:'embedded',   weight:'strong' },
  { a:'embedded',  b:'arm',        weight:'medium' },
  { a:'python',    b:'fastapi',    weight:'strong' },
  { a:'python',    b:'async',      weight:'medium' },
  { a:'fastapi',   b:'async',      weight:'medium' },
  { a:'fastapi',   b:'websockets', weight:'medium' },
  { a:'python',    b:'typescript', weight:'medium' },
  { a:'python',    b:'langgraph',  weight:'strong' },
  { a:'python',    b:'treesitter', weight:'weak'   },
  { a:'python',    b:'embeddings', weight:'medium' },
  { a:'langgraph', b:'rag',        weight:'strong' },
  { a:'rag',       b:'chromadb',   weight:'strong' },
  { a:'rag',       b:'embeddings', weight:'medium' },
  { a:'docker',    b:'kubernetes', weight:'medium' },
  { a:'mongodb',   b:'go',         weight:'weak'   },
  { a:'git',       b:'python',     weight:'strong' },
  { a:'git',       b:'c',          weight:'strong' },
  { a:'git',       b:'docker',     weight:'medium' },
];

// ── Cluster background labels ─────────────────────────────────────────────────
const CLUSTER_LABELS = [
  { id:'sys',   label:'SYSTEMS',        x: 0.13, y: 0.52 },
  { id:'back',  label:'BACKEND',        x: 0.58, y: 0.42 },
  { id:'ai',    label:'AI',             x: 0.85, y: 0.49 },
  { id:'infra', label:'INFRASTRUCTURE', x: 0.38, y: 0.87 },
];

// ── Adjacency ─────────────────────────────────────────────────────────────────
const ADJ = new Map<string, Set<string>>();
EDGES.forEach(({ a, b }) => {
  if (!ADJ.has(a)) ADJ.set(a, new Set());
  if (!ADJ.has(b)) ADJ.set(b, new Set());
  ADJ.get(a)!.add(b);
  ADJ.get(b)!.add(a);
});

// ── Primary node IDs for ambient pulse ───────────────────────────────────────
const PRIMARY_IDS = NODES.filter(n => n.size === 'XL' || n.size === 'L').map(n => n.id);

// ── Position computation ──────────────────────────────────────────────────────
function computePositions(w: number, h: number): Map<string, { x: number; y: number }> {
  const map = new Map<string, { x: number; y: number }>();
  NODES.forEach(n => map.set(n.id, { x: w * n.pos.x, y: h * n.pos.y }));
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip
// ─────────────────────────────────────────────────────────────────────────────

function NodeTooltip({ node, x, y, svgH, showSamsung }: {
  node: NodeDef; x: number; y: number; svgH: number; showSamsung: boolean;
}) {
  const r = NODE_R[node.size];
  const flipUp = y + r + 130 > svgH;
  return (
    <div style={{
      position: 'absolute',
      left: x,
      top: flipUp ? y - r - 16 : y + r + 16,
      transform: flipUp ? 'translateX(-50%) translateY(-100%)' : 'translateX(-50%)',
      background: 'rgba(8,8,8,0.92)',
      backdropFilter: 'blur(12px)',
      border: '1px solid var(--border-rest)',
      borderRadius: '4px',
      padding: '12px 14px',
      minWidth: '160px',
      maxWidth: '240px',
      pointerEvents: 'none',
      zIndex: 20,
      animation: flipUp ? 'tooltipInUp 200ms ease-out forwards' : 'tooltipIn 200ms ease-out forwards',
    }}>
      <p className="text-mono" style={{ color: 'var(--text-primary)', fontSize: '11px', letterSpacing: '0.12em', marginBottom: '8px' }}>
        {node.label.toUpperCase()}
      </p>
      <div style={{ width: '24px', height: '1px', background: 'var(--border-active)', marginBottom: '8px' }} />
      <p className="text-mono" style={{ color: 'var(--text-secondary)', fontSize: '10px', marginBottom: '6px' }}>
        {node.period}
      </p>
      <p style={{ fontFamily: 'var(--font-display), sans-serif', color: 'var(--text-primary)', fontSize: '12px', lineHeight: 1.5 }}>
        {node.usedIn(showSamsung)}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Constellation
// ─────────────────────────────────────────────────────────────────────────────

function Constellation({ onHoverChange }: { onHoverChange?: (label: string | null) => void }) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const innerGRefs     = useRef(new Map<string, SVGGElement>());
  const mouseRef       = useRef({ x: 0, y: 0 });
  const smoothMRef     = useRef({ x: 0, y: 0 });
  const rafRef         = useRef<number>(0);
  const inViewRef      = useRef(false);
  const reducedRef     = useRef(false);

  // Pulse system
  const pulseCanvasRef = useRef<HTMLCanvasElement>(null);
  const pulsesRef      = useRef<PulseState[]>([]);
  const positionsRef   = useRef<Map<string, { x: number; y: number }>>(new Map());
  const hoveredIdRef   = useRef<string | null>(null);
  const pulseRafRef    = useRef<number>(0);
  const signalsOn      = useRef(false);

  // Entrance animation
  const entTimers      = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Ambient pulse
  const ambientPulse   = useRef<AmbientPulse | null>(null);
  const ambientTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [dims, setDims]             = useState({ w: 0, h: 0 });
  const [hoveredId, setHoveredId]   = useState<string | null>(null);
  const [entPhase, setEntPhase]     = useState(0);

  const positions = useMemo(() => computePositions(dims.w, dims.h), [dims]);

  // ── Resize ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setDims({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Mouse ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    function onMove(e: MouseEvent) { mouseRef.current = { x: e.clientX, y: e.clientY }; }
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // ── Reduced motion ───────────────────────────────────────────────────────────
  useEffect(() => {
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // ── IntersectionObserver + entrance sequence (every scroll-in) ───────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function startEntrance() {
      entTimers.current.forEach(clearTimeout);
      entTimers.current = [];
      setEntPhase(0);
      const t1 = setTimeout(() => setEntPhase(1), 80);   // skeleton edges + corner markers
      const t2 = setTimeout(() => setEntPhase(2), 500);  // nodes illuminate
      const t3 = setTimeout(() => setEntPhase(3), 950);  // edges resolve to full weights
      const t4 = setTimeout(() => setEntPhase(4), 1350); // cluster labels emerge
      const t5 = setTimeout(() => setEntPhase(5), 1850); // signal traffic begins
      entTimers.current = [t1, t2, t3, t4, t5];
    }

    const obs = new IntersectionObserver(([e]) => {
      inViewRef.current = e.isIntersecting;
      if (e.isIntersecting) {
        startEntrance();
      } else {
        entTimers.current.forEach(clearTimeout);
        setEntPhase(0);
        signalsOn.current = false;
        pulsesRef.current = [];
      }
    }, { threshold: 0.15 });

    obs.observe(el);
    return () => { obs.disconnect(); entTimers.current.forEach(clearTimeout); };
  }, []);

  // ── Gate signals + seed initial pulses at phase 5 ───────────────────────────
  useEffect(() => {
    signalsOn.current = entPhase >= 5;
    if (entPhase === 5 && positionsRef.current.size > 0) {
      const seedCount = 3;
      for (let i = 0; i < seedCount; i++) {
        const startId = NODES[Math.floor(Math.random() * NODES.length)].id;
        const adj = ADJ.get(startId);
        if (adj && adj.size > 0) {
          const toId = [...adj][Math.floor(Math.random() * adj.size)];
          pulsesRef.current.push({
            fromId: startId, toId, prevFromId: null,
            rawT: 0, paused: false, pauseUntil: 0, opacity: 0, retired: false,
          });
        }
      }
    }
  }, [entPhase]);

  // ── Node drift + parallax loop ───────────────────────────────────────────────
  useEffect(() => {
    if (dims.w === 0) return;
    const cx = dims.w / 2;
    const cy = dims.h / 2;

    function frame(ts: number) {
      rafRef.current = requestAnimationFrame(frame);
      if (!inViewRef.current || reducedRef.current) return;

      const sm = smoothMRef.current;
      const m  = mouseRef.current;
      sm.x += (m.x - sm.x) * 0.06;
      sm.y += (m.y - sm.y) * 0.06;
      const dx = sm.x - cx;
      const dy = sm.y - cy;
      const t  = ts * 0.001;

      NODES.forEach(node => {
        const el = innerGRefs.current.get(node.id);
        if (!el) return;
        const driftX = Math.sin(t * 0.38 + node.phase) * 2.5;
        const driftY = Math.cos(t * 0.34 + node.phase * 1.3) * 2.5;
        const px     = dx * -0.012 * node.depth;
        const py     = dy * -0.012 * node.depth;
        el.setAttribute('transform', `translate(${(driftX + px).toFixed(2)},${(driftY + py).toFixed(2)})`);
      });
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [dims]);

  // ── Sync refs ────────────────────────────────────────────────────────────────
  useEffect(() => { positionsRef.current = positions; }, [positions]);
  useEffect(() => { hoveredIdRef.current = hoveredId; }, [hoveredId]);

  // ── Ambient pulse timer ──────────────────────────────────────────────────────
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    function scheduleNext() {
      const delay = 3500 + Math.random() * 3000;
      ambientTimer.current = setTimeout(() => {
        const nodeId = PRIMARY_IDS[Math.floor(Math.random() * PRIMARY_IDS.length)];
        ambientPulse.current = { nodeId, t: 0 };
        scheduleNext();
      }, delay);
    }

    const initial = setTimeout(scheduleNext, 5000);
    return () => {
      clearTimeout(initial);
      if (ambientTimer.current) clearTimeout(ambientTimer.current);
    };
  }, []);

  // ── Pulse + ambient canvas loop ──────────────────────────────────────────────
  useEffect(() => {
    if (dims.w === 0) return;
    const canvas = pulseCanvasRef.current;
    if (!canvas) return;
    canvas.width  = dims.w;
    canvas.height = dims.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const c: CanvasRenderingContext2D = ctx;
    const cv: HTMLCanvasElement = canvas;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    function spawnPulse() {
      if (!signalsOn.current) return;
      if (pulsesRef.current.filter(p => !p.retired).length >= 7) return;
      if (positionsRef.current.size === 0) return;
      const startId = NODES[Math.floor(Math.random() * NODES.length)].id;
      const adj = ADJ.get(startId);
      if (!adj || adj.size === 0) return;
      const toId = [...adj][Math.floor(Math.random() * adj.size)];
      pulsesRef.current.push({
        fromId: startId, toId, prevFromId: null,
        rawT: 0, paused: false, pauseUntil: 0, opacity: 0, retired: false,
      });
    }

    function pulseFrame(ts: number) {
      pulseRafRef.current = requestAnimationFrame(pulseFrame);
      if (!inViewRef.current) { c.clearRect(0, 0, cv.width, cv.height); return; }

      const pos   = positionsRef.current;
      const isHov = hoveredIdRef.current !== null;

      c.clearRect(0, 0, cv.width, cv.height);

      // Ambient node pulse ring
      if (ambientPulse.current) {
        const ap    = ambientPulse.current;
        const apos  = pos.get(ap.nodeId);
        const anode = NODES.find(n => n.id === ap.nodeId);
        if (apos && anode) {
          ap.t = Math.min(ap.t + 0.005, 1);
          const baseR  = NODE_R[anode.size];
          const pulseR = baseR + ap.t * 24;
          const pulseO = (1 - ap.t) * 0.30;
          c.beginPath();
          c.arc(apos.x, apos.y, pulseR, 0, Math.PI * 2);
          c.strokeStyle = `rgba(244,244,242,${pulseO})`;
          c.lineWidth = 0.9;
          c.stroke();
          if (ap.t >= 1) ambientPulse.current = null;
        }
      }

      const toRemove: number[] = [];

      pulsesRef.current.forEach((pulse, idx) => {
        pulse.opacity += ((isHov ? 0 : 1) - pulse.opacity) * 0.08;

        if (pulse.retired) {
          if (pulse.opacity < 0.01) toRemove.push(idx);
          return;
        }

        if (pulse.paused) {
          if (ts >= pulse.pauseUntil) {
            const adj = ADJ.get(pulse.toId);
            if (!adj) { pulse.retired = true; return; }
            const all       = [...adj].filter(id => id !== pulse.fromId);
            const preferred = all.filter(id => id !== pulse.prevFromId);
            const pool      = preferred.length > 0 ? preferred : (all.length > 0 ? all : null);
            if (!pool) { pulse.retired = true; return; }
            if (Math.random() < 0.08) { pulse.retired = true; return; }
            const nextId     = pool[Math.floor(Math.random() * pool.length)];
            pulse.prevFromId = pulse.fromId;
            pulse.fromId     = pulse.toId;
            pulse.toId       = nextId;
            pulse.rawT       = 0;
            pulse.paused     = false;
          }
          return;
        }

        const fromPos = pos.get(pulse.fromId);
        const toPos   = pos.get(pulse.toId);
        if (!fromPos || !toPos) return;

        const dx      = toPos.x - fromPos.x;
        const dy      = toPos.y - fromPos.y;
        const edgeLen = Math.sqrt(dx*dx + dy*dy);
        if (edgeLen < 1) { pulse.rawT = 1; return; }

        const speed    = 65 / (edgeLen * 60);
        const beamFrac = 28 / edgeLen;

        pulse.rawT = Math.min(pulse.rawT + speed, 1 + beamFrac + 0.001);

        let headET: number;
        let tailET: number;
        if (pulse.rawT <= 1) {
          headET = easeInOutSine(pulse.rawT);
          tailET = Math.max(0, headET - beamFrac);
        } else {
          headET = 1.0;
          tailET = Math.min(1.0, (1 - beamFrac) + (pulse.rawT - 1));
        }

        const headX = fromPos.x + dx * headET;
        const headY = fromPos.y + dy * headET;
        const tailX = fromPos.x + dx * tailET;
        const tailY = fromPos.y + dy * tailET;

        const a = pulse.opacity;

        // Path illumination — edge glows as signal travels through it
        if (a > 0.05 && headET > 0.01) {
          c.beginPath();
          c.moveTo(fromPos.x, fromPos.y);
          c.lineTo(headX, headY);
          c.strokeStyle = `rgba(255,255,255,${a * 0.07})`;
          c.lineWidth = 1.8;
          c.stroke();
        }

        if (a < 0.01) {
          if (tailET >= 1.0) { pulse.paused = true; pulse.pauseUntil = ts + 150 + Math.random() * 450; }
          return;
        }

        if (Math.abs(headX - tailX) > 0.5 || Math.abs(headY - tailY) > 0.5) {
          c.beginPath();
          c.moveTo(tailX, tailY);
          c.lineTo(headX, headY);
          c.strokeStyle = `rgba(200,228,255,${a * 0.72})`;
          c.lineWidth = 1.4;
          c.stroke();
        }

        if (tailET >= 1.0) {
          pulse.paused     = true;
          pulse.pauseUntil = ts + 150 + Math.random() * 450;
        }
      });

      for (let i = toRemove.length - 1; i >= 0; i--) {
        pulsesRef.current.splice(toRemove[i], 1);
      }

      if (signalsOn.current &&
          pulsesRef.current.filter(p => !p.retired).length < 7 &&
          Math.random() < 0.018) {
        spawnPulse();
      }
    }

    pulseRafRef.current = requestAnimationFrame(pulseFrame);
    return () => cancelAnimationFrame(pulseRafRef.current);
  }, [dims]);

  // ── Interaction handlers ─────────────────────────────────────────────────────
  const handleEnter = useCallback((id: string) => {
    setHoveredId(id);
    const node = NODES.find(n => n.id === id);
    onHoverChange?.(node?.label ?? null);
  }, [onHoverChange]);

  const handleLeave = useCallback(() => {
    setHoveredId(null);
    onHoverChange?.(null);
  }, [onHoverChange]);

  // ── Edge visual helpers ──────────────────────────────────────────────────────
  const getEdgeOpacity = (edge: EdgeDef) => {
    if (entPhase < 1) return 0;
    if (entPhase < 3) return 0.4; // skeleton: applies to dim stroke below
    if (!hoveredId) return 1;
    return (edge.a === hoveredId || edge.b === hoveredId) ? 1 : 0.08;
  };

  const getEdgeStroke = (edge: EdgeDef) => {
    if (entPhase < 3) return 'rgba(255,255,255,0.032)';
    if (hoveredId && (edge.a === hoveredId || edge.b === hoveredId)) return 'rgba(255,255,255,0.65)';
    return `rgba(255,255,255,${EDGE_OPACITY[edge.weight]})`;
  };

  const getEdgeWidth = (edge: EdgeDef) => {
    if (hoveredId && (edge.a === hoveredId || edge.b === hoveredId)) return 1.6;
    return EDGE_WIDTH[edge.weight];
  };

  const nodeCircleOpacity = (id: string) => {
    if (entPhase < 2) return 0;
    return !hoveredId ? 1 : id === hoveredId || ADJ.get(hoveredId)?.has(id) ? 1 : 0.22;
  };

  const nodeLabelOpacity = (id: string) => {
    if (entPhase < 2) return 0;
    return !hoveredId ? 0.65 : id === hoveredId || ADJ.get(hoveredId)?.has(id) ? 1 : 0.10;
  };

  const hovered    = hoveredId ? NODES.find(n => n.id === hoveredId) ?? null : null;
  const hoveredPos = hoveredId ? positions.get(hoveredId) : undefined;

  const T = 'transition: opacity 400ms ease-out, transform 300ms ease-out';

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0 }}>

      {/* Blueprint corner markers */}
      {(['tl','tr','bl','br'] as const).map(pos => (
        <div
          key={pos}
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: 22,
            height: 22,
            [pos.startsWith('t') ? 'top' : 'bottom']: 10,
            [pos.endsWith('l') ? 'left' : 'right']: 10,
            borderTop:    pos.startsWith('t') ? '1px solid rgba(255,255,255,0.11)' : undefined,
            borderBottom: pos.startsWith('b') ? '1px solid rgba(255,255,255,0.11)' : undefined,
            borderLeft:   pos.endsWith('l')   ? '1px solid rgba(255,255,255,0.11)' : undefined,
            borderRight:  pos.endsWith('r')   ? '1px solid rgba(255,255,255,0.11)' : undefined,
            pointerEvents: 'none',
            opacity: entPhase >= 1 ? 1 : 0,
            transition: 'opacity 600ms ease-out',
          }}
        />
      ))}

      {/* Pulse + ambient canvas — behind SVG nodes */}
      <canvas
        ref={pulseCanvasRef}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', width: '100%', height: '100%' }}
      />

      {dims.w > 0 && (
        <svg
          role="img"
          aria-label="Technology stack constellation — hover nodes to explore connections"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
        >
          {/* Cluster background labels — behind everything */}
          {CLUSTER_LABELS.map(cl => (
            <text
              key={cl.id}
              x={dims.w * cl.x}
              y={dims.h * cl.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="var(--font-jetbrains), monospace"
              fontSize={Math.min(dims.w * 0.056, 64)}
              letterSpacing="0.18em"
              fill="rgba(255,255,255,1)"
              style={{
                opacity: entPhase >= 4 ? (hoveredId ? 0.014 : 0.026) : 0,
                transition: 'opacity 700ms ease-out',
                pointerEvents: 'none',
                userSelect: 'none',
              } as React.CSSProperties}
            >
              {cl.label}
            </text>
          ))}

          {/* Edges */}
          {EDGES.map((edge, i) => {
            const pa = positions.get(edge.a);
            const pb = positions.get(edge.b);
            if (!pa || !pb) return null;
            return (
              <line
                key={`e${i}`}
                x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                stroke={getEdgeStroke(edge)}
                strokeWidth={getEdgeWidth(edge)}
                vectorEffect="non-scaling-stroke"
                style={{
                  opacity: getEdgeOpacity(edge),
                  transition: 'opacity 450ms ease-out, stroke 300ms ease-out, stroke-width 300ms ease-out',
                  pointerEvents: 'none',
                } as React.CSSProperties}
              />
            );
          })}

          {/* Nodes */}
          {NODES.map(node => {
            const pos = positions.get(node.id);
            if (!pos) return null;
            const r         = NODE_R[node.size];
            const fs        = NODE_FS[node.size];
            const isH       = hoveredId === node.id;
            const nO        = nodeCircleOpacity(node.id);
            const lO        = nodeLabelOpacity(node.id);
            const isPrimary = node.size === 'XL' || node.size === 'L';

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x},${pos.y})`}
                tabIndex={0}
                role="button"
                aria-label={`${node.label}: ${node.usedIn(siteConfig.showSamsung)}`}
                onMouseEnter={() => handleEnter(node.id)}
                onMouseLeave={handleLeave}
                onFocus={() => handleEnter(node.id)}
                onBlur={handleLeave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const toggling = hoveredId === node.id;
                    setHoveredId(prev => prev === node.id ? null : node.id);
                    onHoverChange?.(toggling ? null : node.label);
                  }
                  if (e.key === 'Escape') { setHoveredId(null); onHoverChange?.(null); }
                }}
                style={{ cursor: 'default', outline: 'none' }}
              >
                <g
                  ref={el => {
                    if (el) innerGRefs.current.set(node.id, el);
                    else    innerGRefs.current.delete(node.id);
                  }}
                  style={{ filter: node.depth > 0.65 ? 'blur(0.5px)' : 'none' }}
                >
                  {/* Persistent ring on primary nodes — vanishes when hover rings take over */}
                  {isPrimary && (
                    <circle r={r + 6} fill="none" stroke="rgba(255,255,255,1)"
                      strokeWidth="0.6" vectorEffect="non-scaling-stroke"
                      style={{
                        opacity: isH ? 0 : (entPhase >= 2 ? 0.13 : 0),
                        transition: 'opacity 400ms ease-out',
                        pointerEvents: 'none',
                      } as React.CSSProperties} />
                  )}
                  {/* Hover accent rings */}
                  <circle r={r + 8} fill="none" stroke="var(--accent)" strokeWidth="0.8"
                    opacity={isH ? 0.35 : 0} vectorEffect="non-scaling-stroke"
                    style={{ transition: 'opacity 300ms ease-out', pointerEvents: 'none' } as React.CSSProperties} />
                  <circle r={r + 4} fill="none" stroke="var(--accent)" strokeWidth="1"
                    opacity={isH ? 0.75 : 0} vectorEffect="non-scaling-stroke"
                    style={{ transition: 'opacity 300ms ease-out', pointerEvents: 'none' } as React.CSSProperties} />
                  {/* Node fill */}
                  <circle r={r} fill="rgba(255,255,255,0.90)"
                    style={{
                      opacity: nO,
                      transform: isH ? 'scale(1.5)' : 'scale(1)',
                      transformOrigin: '50% 50%',
                      transformBox: 'fill-box',
                      transition: T,
                    } as React.CSSProperties} />
                  {/* Label */}
                  <text y={r + 14} textAnchor="middle"
                    fontFamily="var(--font-jetbrains), monospace"
                    fontSize={fs} fill="rgba(255,255,255,0.90)" letterSpacing="0.8"
                    style={{
                      opacity: lO, userSelect: 'none',
                      transition: 'opacity 300ms ease-out', pointerEvents: 'none',
                    } as React.CSSProperties}>
                    {node.label.toUpperCase()}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      )}

      {/* Tooltip */}
      {hovered && hoveredPos && (
        <NodeTooltip
          node={hovered} x={hoveredPos.x} y={hoveredPos.y}
          svgH={dims.h} showSamsung={siteConfig.showSamsung}
        />
      )}

      {/* Screen-reader list */}
      <ul className="sr-only" aria-label="Technology stack by cluster">
        {(['systems','backend','ai','infra','center'] as ClusterId[]).map(cid => (
          <li key={cid}>
            <ul>
              {NODES.filter(n => n.cluster === cid).map(n => (
                <li key={n.id}>{n.label} — {n.period} — {n.usedIn(siteConfig.showSamsung)}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile typographic fallback
// ─────────────────────────────────────────────────────────────────────────────

const MOBILE_CLUSTERS = [
  { label: 'SYSTEMS',        sub: 'Kernel · Embedded · Hardware',      ids: ['linux','c','cpp','embedded','arm','buildroot'] },
  { label: 'BACKEND',        sub: 'Distributed · Async · API',         ids: ['python','go','typescript','fastapi','async','websockets'] },
  { label: 'AI / ML',        sub: 'Retrieval · Multimodal · Agents',   ids: ['langgraph','rag','chromadb','embeddings','treesitter'] },
  { label: 'INFRASTRUCTURE', sub: 'Deploy · Observe · Scale',          ids: ['docker','kubernetes','postgres','mongodb','git'] },
];

function MobileStack() {
  const nodeById = useMemo(() => new Map(NODES.map(n => [n.id, n])), []);
  return (
    <div style={{ paddingBottom: 'clamp(80px, 12vh, 120px)' }}>
      {MOBILE_CLUSTERS.map((cluster, ci) => (
        <div
          key={cluster.label}
          style={{
            paddingTop: 'clamp(40px, 5vh, 56px)',
            paddingBottom: 'clamp(40px, 5vh, 56px)',
            borderBottom: ci < MOBILE_CLUSTERS.length - 1 ? '1px solid var(--border-rest)' : 'none',
          }}
        >
          <p className="text-mono" style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {cluster.label}
          </p>
          <p className="text-mono" style={{ color: 'var(--text-tertiary)', marginBottom: '16px', fontSize: '10px' }}>
            {cluster.sub}
          </p>
          <p style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 'clamp(16px, 2vw, 20px)', fontWeight: 500, lineHeight: 1.9, color: 'var(--text-primary)' }}>
            {cluster.ids.map((id, i) => {
              const node = nodeById.get(id);
              if (!node) return null;
              return (
                <span key={id}>
                  {node.label}
                  {i < cluster.ids.length - 1 && (
                    <span style={{ color: 'var(--text-tertiary)', margin: '0 10px' }}>·</span>
                  )}
                </span>
              );
            })}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section shell
// ─────────────────────────────────────────────────────────────────────────────

export default function TechStack() {
  const [isMobile, setIsMobile]       = useState(false);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768); }
    check();
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <section
      id="tech-stack"
      aria-labelledby="tech-heading"
      style={{
        position: 'relative',
        height: isMobile ? 'auto' : '100vh',
        borderTop: '1px solid var(--border-rest)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: isMobile ? 'static' : 'absolute',
          top: isMobile ? undefined : '72px',
          left: isMobile ? undefined : 'clamp(24px, 5.5vw, 80px)',
          zIndex: 2,
          padding: isMobile ? 'clamp(80px, 10vh, 100px) clamp(24px, 5.5vw, 80px) 0' : undefined,
        }}
      >
        <p className="text-mono" style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>
          05 / STACK
        </p>
        <h2
          id="tech-heading"
          className="text-section"
          style={{ color: 'var(--text-primary)', marginBottom: '8px' }}
        >
          A graph of what I<br />work with.
        </h2>
        {!isMobile && (
          <p
            className="text-mono"
            style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '8px', transition: 'opacity 200ms ease-out, color 200ms ease-out' }}
          >
            {hoveredLabel ? `WORKING WITH ${hoveredLabel.toUpperCase()}` : 'HOVER TO EXPLORE'}
          </p>
        )}
      </div>

      {isMobile ? (
        <div style={{ paddingInline: 'clamp(24px, 5.5vw, 80px)' }}>
          <MobileStack />
        </div>
      ) : (
        <Constellation onHoverChange={setHoveredLabel} />
      )}
    </section>
  );
}
