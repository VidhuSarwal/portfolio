'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { siteConfig } from '@/lib/config';
import contributionsData from '@/data/kernel-contributions.json';
import { patchCount, type KernelContribution } from '@/app/kernel/kernel';

const TICKER_A =
  'LINUX KERNEL · IIO DRIVERS · DEVICE TREE · EMBEDDED C · FREERTOS · STM32 · ARM64 · BUILDROOT · ASSEMBLY · I2C / SPI / UART · ';
const TICKER_B =
  'FIRECRACKER · KVM / QEMU · EBPF · NFTABLES · PYTHON · GO · LANGGRAPH · RAG · CHROMADB · FASTAPI · DOCKER · AWS EC2 · ';

// Kernel tile reads the patch log, so it moves with /kernel
const KERNEL = (contributionsData as { contributions: KernelContribution[] }).contributions;
const KERNEL_SENT     = patchCount(KERNEL);
const KERNEL_ACCEPTED = patchCount(KERNEL.filter((c) => c.status === 'merged'));

// ── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1100) {
  const [count, setCount]   = useState(0);
  const startedRef           = useRef(false);
  const rafRef               = useRef(0);

  // Stop an in-flight count on unmount
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const trigger = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    // Reduced motion: no count-up, show the final value
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(target);
      return;
    }
    const t0 = performance.now();
    function tick(now: number) {
      const p = Math.min((now - t0) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setCount(Math.round(target * e));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [target, duration]);

  return { count, trigger };
}

// ── Single stat card ──────────────────────────────────────────────────────────
function StatCard({
  value, suffix, label, sub, delay,
}: {
  value: number; suffix: string; label: string; sub: string; delay: number;
}) {
  const ref            = useRef<HTMLDivElement>(null);
  const { count, trigger } = useCountUp(value);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Reduced motion: final numbers immediately, no scroll trigger
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { trigger(); return; }
    let t: ReturnType<typeof setTimeout> | undefined;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect(); // one-shot
        t = setTimeout(trigger, delay);
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => { obs.disconnect(); clearTimeout(t); };
  }, [trigger, delay]);

  return (
    <div
      ref={ref}
      role="figure"
      aria-label={`${value}${suffix} ${label}`}
      // Focusable so keyboard users can reveal the sub line too
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      style={{
        flex: 1,
        padding: 'clamp(28px, 4vh, 48px) clamp(28px, 3.5vw, 52px)',
        borderLeft: '1px solid var(--border-rest)',
        cursor: 'default',
        background: hovered ? 'var(--hover-surface)' : 'transparent',
        transition: 'background 0.25s ease',
        minWidth: 0,
      }}
    >
      {/* Number */}
      <div
        style={{
          fontFamily: 'var(--font-display), system-ui, sans-serif',
          fontSize: 'clamp(48px, 5.5vw, 80px)',
          fontWeight: 700,
          letterSpacing: '-0.035em',
          lineHeight: 1,
          color: hovered ? 'var(--accent)' : 'var(--text-primary)',
          transition: 'color 0.25s ease',
          marginBottom: '12px',
        }}
      >
        {count}{suffix}
      </div>

      {/* Label */}
      <p
        className="text-mono"
        style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '11px', letterSpacing: '0.13em' }}
      >
        {label}
      </p>

      {/* Sub — reveals on hover */}
      <p
        className="text-body"
        style={{
          color: 'var(--text-tertiary)',
          fontSize: 'clamp(12px, 0.9vw, 14px)',
          lineHeight: 1.5,
          maxHeight: hovered ? '60px' : '0px',
          opacity: hovered ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease, opacity 0.25s ease',
        }}
      >
        {sub}
      </p>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
export default function StatsBridge() {
  const stats = [
    {
      value: 20, suffix: '+', label: 'TECHNOLOGIES',
      sub: 'Across systems, backend & AI — most used daily.',
    },
    {
      value: KERNEL_ACCEPTED, suffix: '', label: 'KERNEL PATCHES ACCEPTED',
      sub: `${KERNEL_SENT} sent upstream · IIO, staging, NTFS3 · some in stable.`,
    },
    {
      value: 61, suffix: 'K', label: 'LOC SHIPPED',
      sub: siteConfig.showSamsung
        ? 'Samsung PRISM — async Python platform, 70% latency cut.'
        : 'Production AI platform — adopted across teams.',
    },
  ];

  return (
    <div
      style={{
        borderTop: '1px solid var(--border-rest)',
        overflow: 'hidden',
      }}
    >
      {/* ── Ticker A — left ─────────────────────────────────────── */}
      <div
        style={{
          paddingBlock: 'clamp(28px, 4vh, 44px)',
          borderBottom: '1px solid var(--border-rest)',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          className="marquee-track text-mono"
          style={{
            display: 'inline-block',
            animation: 'marqueeLeft 32s linear infinite',
            color: 'var(--text-tertiary)',
            fontSize: '11px',
            letterSpacing: '0.15em',
          }}
        >
          {TICKER_A}{TICKER_A}{TICKER_A}
        </span>
      </div>

      {/* ── Stats row ───────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-rest)',
        }}
      >
        {stats.map((s, i) => (
          <StatCard
            key={s.label}
            value={s.value}
            suffix={s.suffix}
            label={s.label}
            sub={s.sub}
            delay={i * 140}
          />
        ))}
      </div>

      {/* ── Ticker B — right ────────────────────────────────────── */}
      <div
        style={{
          paddingBlock: 'clamp(28px, 4vh, 44px)',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          className="marquee-track text-mono"
          style={{
            display: 'inline-block',
            animation: 'marqueeRight 38s linear infinite',
            color: 'var(--text-tertiary)',
            fontSize: '11px',
            letterSpacing: '0.15em',
          }}
        >
          {TICKER_B}{TICKER_B}{TICKER_B}
        </span>
      </div>
    </div>
  );
}
