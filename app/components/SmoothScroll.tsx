'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

// Routes that use native scroll instead of Lenis
const NO_SMOOTH_SCROLL_ROUTES = new Set(['/kernel']);

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const removeFrameRef = useRef<(() => void) | null>(null);
  const pathname = usePathname();
  const didMount = useRef(false);

  useEffect(() => {
    // scrollRestoration must be manual so Lenis controls position; idempotent to set each time
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    // Scroll-to-top only on initial mount — back-navigation should not force the user to the top
    if (!didMount.current) {
      window.scrollTo(0, 0);
      didMount.current = true;
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Skip Lenis on excluded routes — lenis.stop() calls preventDefault and kills native scroll
    if (reduced || NO_SMOOTH_SCROLL_ROUTES.has(pathname)) return;

    let cancelled = false;
    const lenis = new Lenis({ duration: 1.2 });
    lenisRef.current = lenis;

    (async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      // cancelled is set synchronously in cleanup — if true, this run was superseded
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);
      // Use closure-captured lenis, not lenisRef.current, to avoid touching a newer instance
      lenis.on('scroll', ScrollTrigger.update);

      function onFrame(time: number) { lenis.raf(time * 1000); }
      gsap.ticker.add(onFrame);
      gsap.ticker.lagSmoothing(0);

      removeFrameRef.current = () => gsap.ticker.remove(onFrame);
    })();

    return () => {
      cancelled = true;
      removeFrameRef.current?.();
      removeFrameRef.current = null;
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, [pathname]);

  return <>{children}</>;
}
