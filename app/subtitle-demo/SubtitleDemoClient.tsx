'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const DOMAINS = ['Linux kernel', 'Distributed systems', 'AI infrastructure'];
const FULL = 'Linux kernel · Distributed systems · AI infrastructure.';
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#@$%&?/\\[]{}';

const subtitleStyle: React.CSSProperties = {
  fontSize: 'clamp(20px, 2.5vw, 34px)',
  fontWeight: 500,
  color: 'var(--text-tertiary)',
  lineHeight: 1.35,
  minHeight: '2.2em',
};

/* ─────────────────────────────────────────────────────────────────────
   A — CHARACTER SCRAMBLE (original)
───────────────────────────────────────────────────────────────────── */
function ScrambleEffect({ run }: { run: boolean }) {
  const [display, setDisplay] = useState(FULL);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const scramble = useCallback(() => {
    const target = FULL;
    let frame = 0;
    const totalFrames = 28;
    function step() {
      const out = target.split('').map((ch, i) => {
        if (ch === ' ' || ch === '·' || ch === '.') return ch;
        const revealAt = Math.floor((i / target.length) * totalFrames * 0.8);
        return frame > revealAt ? ch : CHARS[Math.floor(Math.random() * CHARS.length)];
      }).join('');
      setDisplay(out);
      if (++frame <= totalFrames) timerRef.current = setTimeout(step, 38);
      else setDisplay(target);
    }
    step();
  }, []);

  useEffect(() => {
    if (run) { setDisplay(FULL); clearTimeout(timerRef.current); setTimeout(scramble, 300); }
    return () => clearTimeout(timerRef.current);
  }, [run, scramble]);

  return (
    <p style={{ ...subtitleStyle, fontFamily: 'var(--font-jetbrains), monospace', letterSpacing: '0.04em' }}>
      {display}
    </p>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   D — SLOT LOCK (original)
───────────────────────────────────────────────────────────────────── */
const DECOY_ROWS = [
  ['compilers', 'microservices', 'computer vision'],
  ['embedded systems', 'cloud infra', 'NLP pipelines'],
  ['device drivers', 'distributed DB', 'LLM ops'],
  ['RTOS', 'service mesh', 'multimodal AI'],
  ['Linux kernel', 'event sourcing', 'ML pipelines'],
  ['Linux kernel', 'Distributed systems', 'transformers'],
  ['Linux kernel', 'Distributed systems', 'AI infrastructure'],
];

function SlotEffect({ run }: { run: boolean }) {
  const [row, setRow] = useState(0);
  const [locked, setLocked] = useState([false, false, false]);

  useEffect(() => {
    if (!run) { setRow(0); setLocked([false, false, false]); return; }
    setRow(0); setLocked([false, false, false]);
    let r = 0;
    const t = setInterval(() => {
      r++;
      setRow(Math.min(r, DECOY_ROWS.length - 1));
      if (r === DECOY_ROWS.length - 3) setLocked([true, false, false]);
      if (r === DECOY_ROWS.length - 2) setLocked([true, true, false]);
      if (r >= DECOY_ROWS.length - 1) { setLocked([true, true, true]); clearInterval(t); }
    }, 120);
    return () => clearInterval(t);
  }, [run]);

  const cur = DECOY_ROWS[Math.min(row, DECOY_ROWS.length - 1)];
  return (
    <p style={{ ...subtitleStyle, display: 'flex', flexWrap: 'wrap', gap: '0 0.4em' }}>
      {cur.map((word, i) => (
        <span key={i} style={{ display: 'inline-flex', gap: '0 0.3em' }}>
          <span style={{ color: locked[i] ? 'var(--text-tertiary)' : '#C8E4FF', transition: 'color 0.3s', fontVariantNumeric: 'tabular-nums', minWidth: i === 0 ? '8ch' : i === 1 ? '15ch' : '13ch' }}>
            {word}
          </span>
          <span style={{ opacity: 0.25 }}>{i < 2 ? ' ·' : '.'}</span>
        </span>
      ))}
    </p>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   F — CIPHER LOCK  ★ hybrid
   Phase 1: all 3 scramble fast (pure noise)
   Phase 2: scramble slows, decoy words briefly surface through the noise
   Phase 3: each domain locks one-by-one — final burst then hard snap
            locked domain flashes accent colour then settles to normal
───────────────────────────────────────────────────────────────────── */
function CipherLockEffect({ run }: { run: boolean }) {
  const FINAL = DOMAINS;
  const DECOYS_PER_SLOT = [
    ['compilers', 'device drivers', 'RTOS', 'Linux kernel'],
    ['microservices', 'distributed DB', 'event sourcing', 'Distributed systems'],
    ['computer vision', 'LLM ops', 'ML pipelines', 'AI infrastructure'],
  ];

  const [words, setWords] = useState(['', '', '']);
  const [locked, setLocked] = useState([false, false, false]);
  const [flash, setFlash] = useState([false, false, false]);
  const rafRef = useRef<ReturnType<typeof setTimeout>>();

  function scrambleWord(target: string, intensity: number): string {
    return target.split('').map(ch => {
      if (ch === ' ') return ' ';
      return Math.random() < intensity ? CHARS[Math.floor(Math.random() * CHARS.length)] : ch;
    }).join('');
  }

  useEffect(() => {
    if (!run) { setWords(['', '', '']); setLocked([false, false, false]); setFlash([false, false, false]); return; }
    clearTimeout(rafRef.current);
    setLocked([false, false, false]);
    setFlash([false, false, false]);

    const startTime = Date.now();
    const PHASE1_END = 300;   // pure scramble
    const PHASE2_END = 900;   // decoy words surface
    const LOCK_0 = 980;       // first domain locks
    const LOCK_1 = 1180;
    const LOCK_2 = 1380;

    const decoyIdx = [0, 0, 0];
    let decoyTimer = 0;

    function tick() {
      const elapsed = Date.now() - startTime;
      const lockedState = [elapsed > LOCK_0, elapsed > LOCK_1, elapsed > LOCK_2];

      setWords(prev => prev.map((_, i) => {
        if (lockedState[i]) return FINAL[i];
        if (elapsed < PHASE1_END) {
          // pure noise
          return scrambleWord(FINAL[i], 1);
        }
        // phase 2: cycle decoys, scramble with decreasing intensity
        const t = (elapsed - PHASE1_END) / (PHASE2_END - PHASE1_END);
        const intensity = 0.85 - t * 0.55; // 0.85 → 0.30
        const decoy = DECOYS_PER_SLOT[i][decoyIdx[i] % DECOYS_PER_SLOT[i].length];
        const padded = decoy.padEnd(FINAL[i].length).slice(0, FINAL[i].length);
        return scrambleWord(padded, intensity);
      }));

      setLocked([elapsed > LOCK_0, elapsed > LOCK_1, elapsed > LOCK_2]);

      // Flash accent on each lock moment
      if (elapsed > LOCK_0 && elapsed < LOCK_0 + 220) setFlash(f => [true, f[1], f[2]]);
      else if (elapsed > LOCK_0 + 220) setFlash(f => [false, f[1], f[2]]);
      if (elapsed > LOCK_1 && elapsed < LOCK_1 + 220) setFlash(f => [f[0], true, f[2]]);
      else if (elapsed > LOCK_1 + 220) setFlash(f => [f[0], false, f[2]]);
      if (elapsed > LOCK_2 && elapsed < LOCK_2 + 220) setFlash(f => [f[0], f[1], true]);
      else if (elapsed > LOCK_2 + 220) setFlash(f => [f[0], f[1], false]);

      // Advance decoy index every 180ms during phase 2
      if (elapsed > PHASE1_END && elapsed - decoyTimer > 280) {
        decoyTimer = elapsed;
        decoyIdx[0] = (decoyIdx[0] + 1) % DECOYS_PER_SLOT[0].length;
        decoyIdx[1] = (decoyIdx[1] + 1) % DECOYS_PER_SLOT[1].length;
        decoyIdx[2] = (decoyIdx[2] + 1) % DECOYS_PER_SLOT[2].length;
      }

      if (elapsed < LOCK_2 + 300) rafRef.current = setTimeout(tick, 70);
    }

    rafRef.current = setTimeout(tick, 50);
    return () => clearTimeout(rafRef.current);
  }, [run]);

  return (
    <p style={{ ...subtitleStyle, display: 'flex', flexWrap: 'wrap', gap: '0 0.4em', fontFamily: 'var(--font-jetbrains), monospace', letterSpacing: '0.03em' }}>
      {words.map((word, i) => (
        <span key={i} style={{ display: 'inline-flex', gap: '0 0.3em', alignItems: 'baseline' }}>
          <span style={{
            display: 'inline-block',
            minWidth: i === 0 ? '8ch' : i === 1 ? '15ch' : '13ch',
            color: flash[i] ? '#C8E4FF' : locked[i] ? 'var(--text-tertiary)' : '#8A8A88',
            transition: flash[i] ? 'none' : 'color 0.4s ease',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {word || ' '}
          </span>
          <span style={{ opacity: 0.25, color: 'var(--text-tertiary)' }}>{i < 2 ? '·' : '.'}</span>
        </span>
      ))}
    </p>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   G — SOLARI FLIP  (airport departure board)
   Each character flips through A→Z before landing on real letter
───────────────────────────────────────────────────────────────────── */
const FLIP_CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz0123456789·.';

function SolariEffect({ run }: { run: boolean }) {
  const [display, setDisplay] = useState(() => FULL.split('').map(() => ' '));
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!run) { setDisplay(FULL.split('').map(() => ' ')); return; }
    clearTimeout(timerRef.current);

    const target = FULL.split('');
    const current = FULL.split('').map(() => ' ');
    // Each char has an independent flip timeline
    const charDelay = target.map((_, i) => i * 22); // stagger start
    const startTime = Date.now();

    function tick() {
      const elapsed = Date.now() - startTime;
      let done = true;
      const next = target.map((ch, i) => {
        if (elapsed < charDelay[i]) { done = false; return current[i]; }
        const localT = elapsed - charDelay[i];
        const flipDuration = 320;
        if (localT >= flipDuration) return ch;
        done = false;
        // Flip through characters proportionally
        const progress = localT / flipDuration;
        const targetIdx = FLIP_CHARS.indexOf(ch);
        if (targetIdx === -1) return ch;
        const flipIdx = Math.floor(progress * targetIdx);
        return FLIP_CHARS[Math.min(flipIdx, targetIdx)] ?? ch;
      });
      setDisplay(next);
      if (!done) timerRef.current = setTimeout(tick, 24);
    }

    timerRef.current = setTimeout(tick, 200);
    return () => clearTimeout(timerRef.current);
  }, [run]);

  return (
    <p style={{ ...subtitleStyle, fontFamily: 'var(--font-jetbrains), monospace', letterSpacing: '0.04em' }}>
      {display.join('')}
    </p>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   H — REDACTION REVEAL  (classified doc declassify)
   ████████ bars sweep left-to-right per domain, revealing text beneath
───────────────────────────────────────────────────────────────────── */
function RedactionEffect({ run }: { run: boolean }) {
  const [reveals, setReveals] = useState([0, 0, 0]); // 0→1 progress per domain

  useEffect(() => {
    if (!run) { setReveals([0, 0, 0]); return; }
    const starts = [200, 600, 1000];
    const duration = 500;

    const intervals = starts.map((start, i) =>
      setTimeout(() => {
        const t0 = Date.now();
        const iv = setInterval(() => {
          const p = Math.min(1, (Date.now() - t0) / duration);
          setReveals(r => { const n = [...r]; n[i] = p; return n; });
          if (p >= 1) clearInterval(iv);
        }, 16);
      }, start)
    );

    return () => intervals.forEach(clearTimeout);
  }, [run]);

  return (
    <p style={{ ...subtitleStyle, display: 'flex', flexWrap: 'wrap', gap: '0 0.4em' }}>
      {DOMAINS.map((domain, i) => (
        <span key={domain} style={{ display: 'inline-flex', gap: '0 0.3em', alignItems: 'baseline', position: 'relative' }}>
          <span style={{ position: 'relative', display: 'inline-block' }}>
            {/* Real text underneath */}
            <span style={{ visibility: 'visible', color: 'var(--text-tertiary)' }}>{domain}</span>
            {/* Redaction bar sliding away */}
            <span style={{
              position: 'absolute', inset: '-1px -2px',
              background: '#3A3A38',
              transformOrigin: 'left center',
              transform: `scaleX(${1 - reveals[i]})`,
              transition: 'none',
              borderRadius: 1,
            }} />
          </span>
          <span style={{ opacity: 0.25 }}>{i < 2 ? ' ·' : '.'}</span>
        </span>
      ))}
    </p>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   I — WEIGHT SHIFT
   Each domain materialises by animating font-weight 100 → 500
   Combined with opacity 0.1 → 1 so it feels like gaining substance
───────────────────────────────────────────────────────────────────── */
function WeightEffect({ run }: { run: boolean }) {
  const [weights, setWeights] = useState([100, 100, 100]);
  const [opacities, setOpacities] = useState([0.08, 0.08, 0.08]);

  useEffect(() => {
    if (!run) { setWeights([100, 100, 100]); setOpacities([0.08, 0.08, 0.08]); return; }
    const starts = [150, 380, 610];
    const duration = 600;

    const timers = starts.map((start, i) =>
      setTimeout(() => {
        const t0 = Date.now();
        const iv = setInterval(() => {
          const p = Math.min(1, (Date.now() - t0) / duration);
          const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
          setWeights(w => { const n = [...w]; n[i] = Math.round(100 + ease * 400); return n; });
          setOpacities(o => { const n = [...o]; n[i] = 0.08 + ease * 0.92; return n; });
          if (p >= 1) clearInterval(iv);
        }, 16);
      }, start)
    );

    return () => timers.forEach(clearTimeout);
  }, [run]);

  return (
    <p style={{ ...subtitleStyle, display: 'flex', flexWrap: 'wrap', gap: '0 0.4em' }}>
      {DOMAINS.map((domain, i) => (
        <span key={domain} style={{ display: 'inline-flex', gap: '0 0.3em' }}>
          <span style={{
            fontWeight: weights[i],
            opacity: opacities[i],
            display: 'inline-block',
          }}>
            {domain}
          </span>
          <span style={{ opacity: 0.25, fontWeight: 400 }}>{i < 2 ? '·' : '.'}</span>
        </span>
      ))}
    </p>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   J — SIGNAL NOISE
   Text appears through horizontal static that clears left-to-right,
   like a signal coming in. Each domain is a separate transmission.
───────────────────────────────────────────────────────────────────── */
function SignalEffect({ run }: { run: boolean }) {
  const [scanPos, setScanPos] = useState([0, 0, 0]); // 0→1 scan progress per domain
  const [noise, setNoise] = useState([
    scrambleDomain(DOMAINS[0]),
    scrambleDomain(DOMAINS[1]),
    scrambleDomain(DOMAINS[2]),
  ]);

  function scrambleDomain(d: string) {
    return d.split('').map(ch => ch === ' ' ? ' ' : CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
  }

  useEffect(() => {
    if (!run) {
      setScanPos([0, 0, 0]);
      setNoise([scrambleDomain(DOMAINS[0]), scrambleDomain(DOMAINS[1]), scrambleDomain(DOMAINS[2])]);
      return;
    }
    const starts = [200, 550, 900];
    const duration = 480;

    const timers = starts.map((start, i) =>
      setTimeout(() => {
        const t0 = Date.now();
        const iv = setInterval(() => {
          const p = Math.min(1, (Date.now() - t0) / duration);
          setScanPos(s => { const n = [...s]; n[i] = p; return n; });
          setNoise(ns => {
            const n = [...ns];
            n[i] = DOMAINS[i].split('').map((ch, ci) => {
              if (ch === ' ') return ' ';
              const charProgress = ci / DOMAINS[i].length;
              if (p > charProgress + 0.1) return ch;
              return CHARS[Math.floor(Math.random() * CHARS.length)];
            }).join('');
            return n;
          });
          if (p >= 1) clearInterval(iv);
        }, 30);
      }, start)
    );

    return () => timers.forEach(clearTimeout);
  }, [run]);

  return (
    <p style={{ ...subtitleStyle, display: 'flex', flexWrap: 'wrap', gap: '0 0.4em', fontFamily: 'var(--font-jetbrains), monospace', letterSpacing: '0.03em' }}>
      {DOMAINS.map((domain, i) => (
        <span key={domain} style={{ display: 'inline-flex', gap: '0 0.3em', alignItems: 'baseline', position: 'relative' }}>
          <span style={{ position: 'relative', display: 'inline-block', minWidth: `${domain.length}ch` }}>
            {noise[i]}
            {/* Scan line */}
            {scanPos[i] < 1 && (
              <span style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `${scanPos[i] * 100}%`,
                width: '2px',
                background: 'linear-gradient(to bottom, transparent, #C8E4FF, transparent)',
                opacity: 0.7,
                pointerEvents: 'none',
              }} />
            )}
          </span>
          <span style={{ opacity: 0.25 }}>{i < 2 ? '·' : '.'}</span>
        </span>
      ))}
    </p>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Shell
───────────────────────────────────────────────────────────────────── */
const OPTIONS = [
  { id: 'F', label: 'Cipher Lock ★', desc: 'Hybrid: all 3 scramble as noise simultaneously → decoy words surface through the scramble → each locks with a flash. The signature effect.' },
  { id: 'A', label: 'Scramble', desc: 'Characters decode left-to-right from random glyphs. Simple, fast, technical.' },
  { id: 'D', label: 'Slot Lock', desc: 'Cycles through decoy tech domains then locks one-by-one. Tells a story about breadth.' },
  { id: 'G', label: 'Solari Flip', desc: 'Airport departure board: each character flips A→Z before landing. Mechanical and premium.' },
  { id: 'H', label: 'Redaction', desc: '████ bars sweep away per domain, as if declassifying. Appropriate for a systems engineer.' },
  { id: 'I', label: 'Weight Shift', desc: 'Text materialises by gaining font-weight 100→500. Staggered. Purely typographic.' },
  { id: 'J', label: 'Signal Noise', desc: 'Horizontal static clears left-to-right per domain with a glowing scan line. Like a transmission coming in.' },
] as const;

type OptionId = typeof OPTIONS[number]['id'];

export default function SubtitleDemoClient() {
  const [active, setActive] = useState<OptionId>('F');
  const [runKey, setRunKey] = useState(0);

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#F4F4F2', fontFamily: 'var(--font-display), system-ui, sans-serif' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '72px 40px' }}>
        <p style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8A8A88', marginBottom: 14 }}>
          SUBTITLE EFFECT DEMO
        </p>
        <h1 style={{ fontSize: 40, fontWeight: 700, marginBottom: 6 }}>Pick the subtitle animation.</h1>
        <p style={{ color: '#8A8A88', marginBottom: 44, lineHeight: 1.6, fontSize: 15 }}>
          Click an option — it plays immediately. Hit ↺ to replay.
        </p>

        {/* Switcher */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 40 }}>
          {OPTIONS.map(opt => (
            <button key={opt.id} data-label={`[ ${opt.label.replace(' ★','')} ]`}
              onClick={() => { setActive(opt.id); setRunKey(k => k + 1); }}
              style={{
                fontFamily: 'var(--font-jetbrains), monospace', fontSize: 10,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '9px 16px',
                border: `1px solid ${active === opt.id ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.09)'}`,
                background: active === opt.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: active === opt.id ? (opt.id === 'F' ? '#C8E4FF' : '#F4F4F2') : '#8A8A88',
                borderRadius: 2, transition: 'all 0.15s',
              }}>
              {opt.label}
            </button>
          ))}
          <button data-label="[ REPLAY ]" onClick={() => setRunKey(k => k + 1)}
            style={{
              fontFamily: 'var(--font-jetbrains), monospace', fontSize: 10,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              padding: '9px 16px',
              border: '1px solid rgba(200,228,255,0.2)', background: 'transparent',
              color: '#C8E4FF', borderRadius: 2, transition: 'all 0.15s',
            }}>↺ REPLAY</button>
        </div>

        {/* Description */}
        <p style={{ color: '#4A4A48', fontSize: 13, lineHeight: 1.6, marginBottom: 44, maxWidth: 560 }}>
          {OPTIONS.find(o => o.id === active)?.desc}
        </p>

        {/* Preview in context */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 44, marginBottom: 56 }}>
          <p style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4A4A48', marginBottom: 28 }}>
            PREVIEW IN CONTEXT
          </p>
          <p style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8A8A88', marginBottom: 16 }}>
            01 / SYSTEMS ENGINEER
          </p>
          <h2 style={{ fontSize: 'clamp(48px, 6.5vw, 96px)', fontWeight: 700, lineHeight: 0.95, letterSpacing: '-0.02em', marginBottom: 20, whiteSpace: 'nowrap' }}>
            Vidhu Sarwal.
          </h2>

          {active === 'F' && <CipherLockEffect key={runKey} run={true} />}
          {active === 'A' && <ScrambleEffect key={runKey} run={true} />}
          {active === 'D' && <SlotEffect key={runKey} run={true} />}
          {active === 'G' && <SolariEffect key={runKey} run={true} />}
          {active === 'H' && <RedactionEffect key={runKey} run={true} />}
          {active === 'I' && <WeightEffect key={runKey} run={true} />}
          {active === 'J' && <SignalEffect key={runKey} run={true} />}
        </div>

        <a href="/" data-label="[ PORTFOLIO ]" style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4A4A48', textDecoration: 'none' }}>
          ← BACK TO PORTFOLIO
        </a>
      </div>
    </div>
  );
}
