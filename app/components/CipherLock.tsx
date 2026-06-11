'use client';

import { useEffect, useRef, useState } from 'react';

const DOMAINS = ['Linux kernel', 'Distributed systems', 'AI infrastructure'];
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#@$%&?/\\[]{}';

const DECOYS_PER_SLOT = [
  ['compilers', 'device drivers', 'RTOS', 'Linux kernel'],
  ['microservices', 'distributed DB', 'event sourcing', 'Distributed systems'],
  ['computer vision', 'LLM ops', 'ML pipelines', 'AI infrastructure'],
];

function scrambleWord(target: string, intensity: number): string {
  return target.split('').map(ch =>
    ch === ' ' ? ' ' : Math.random() < intensity
      ? CHARS[Math.floor(Math.random() * CHARS.length)]
      : ch
  ).join('');
}

export default function CipherLock({ delay = 0 }: { delay?: number }) {
  const [words, setWords] = useState(['', '', '']);
  const [locked, setLocked] = useState([false, false, false]);
  const [flash, setFlash] = useState([false, false, false]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setWords(DOMAINS);
      setLocked([true, true, true]);
      return;
    }

    timerRef.current = setTimeout(() => {
      const PHASE1_END = 300;
      const PHASE2_END = 900;
      const LOCK_0 = 980;
      const LOCK_1 = 1180;
      const LOCK_2 = 1380;

      const startTime = Date.now();
      const decoyIdx = [0, 0, 0];
      let decoyTimer = 0;

      function tick() {
        const elapsed = Date.now() - startTime;
        const lockedState = [elapsed > LOCK_0, elapsed > LOCK_1, elapsed > LOCK_2];

        setWords(DOMAINS.map((final, i) => {
          if (lockedState[i]) return final;
          if (elapsed < PHASE1_END) return scrambleWord(final, 1);
          const t = (elapsed - PHASE1_END) / (PHASE2_END - PHASE1_END);
          const intensity = 0.85 - t * 0.55;
          const decoy = DECOYS_PER_SLOT[i][decoyIdx[i] % DECOYS_PER_SLOT[i].length];
          const padded = decoy.padEnd(final.length).slice(0, final.length);
          return scrambleWord(padded, intensity);
        }));

        setLocked([elapsed > LOCK_0, elapsed > LOCK_1, elapsed > LOCK_2]);

        // Accent flash on each lock
        [LOCK_0, LOCK_1, LOCK_2].forEach((lockAt, i) => {
          if (elapsed > lockAt && elapsed < lockAt + 220) {
            setFlash(f => { const n = [...f] as [boolean,boolean,boolean]; n[i] = true; return n; });
          } else if (elapsed > lockAt + 220) {
            setFlash(f => { const n = [...f] as [boolean,boolean,boolean]; n[i] = false; return n; });
          }
        });

        if (elapsed > PHASE1_END && elapsed - decoyTimer > 280) {
          decoyTimer = elapsed;
          decoyIdx[0] = (decoyIdx[0] + 1) % DECOYS_PER_SLOT[0].length;
          decoyIdx[1] = (decoyIdx[1] + 1) % DECOYS_PER_SLOT[1].length;
          decoyIdx[2] = (decoyIdx[2] + 1) % DECOYS_PER_SLOT[2].length;
        }

        if (elapsed < LOCK_2 + 300) timerRef.current = setTimeout(tick, 70);
      }

      timerRef.current = setTimeout(tick, 50);
    }, delay);

    return () => clearTimeout(timerRef.current);
  }, [delay]);

  return (
    <p
      style={{
        fontSize: 'clamp(20px, 2.5vw, 34px)',
        fontWeight: 500,
        color: 'var(--text-tertiary)',
        lineHeight: 1.35,
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0 0.4em',
        fontFamily: 'var(--font-jetbrains), monospace',
        letterSpacing: '0.03em',
      }}
    >
      {DOMAINS.map((_, i) => (
        <span key={i} style={{ display: 'inline-flex', gap: '0 0.3em', alignItems: 'baseline' }}>
          <span style={{
            display: 'inline-block',
            minWidth: i === 0 ? '8ch' : i === 1 ? '15ch' : '13ch',
            color: flash[i] ? 'var(--accent)' : locked[i] ? 'var(--text-tertiary)' : '#8A8A88',
            transition: flash[i] ? 'none' : 'color 0.4s ease',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {words[i] || ' '}
          </span>
          <span style={{ opacity: 0.25, color: 'var(--text-tertiary)' }}>
            {i < 2 ? '·' : '.'}
          </span>
        </span>
      ))}
    </p>
  );
}
