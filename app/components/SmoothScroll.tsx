'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const removeFrameRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Always scroll to top on page load / refresh
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    // Static Lenis init — synchronous, no race
    const lenis = new Lenis({ duration: 1.2 });
    lenisRef.current = lenis;

    // Bridge animation lock/unlock — dispatched by BridgeOscilloscope
    function onBridgeLock()   { lenisRef.current?.stop(); }
    function onBridgeUnlock() { lenisRef.current?.start(); }
    document.addEventListener('bridge-lock',   onBridgeLock);
    document.addEventListener('bridge-unlock', onBridgeUnlock);

    // Async GSAP import — guarded against unmount
    (async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      if (!lenisRef.current) return; // unmounted before this resolved

      gsap.registerPlugin(ScrollTrigger);
      lenisRef.current.on('scroll', ScrollTrigger.update);

      function onFrame(time: number) { lenisRef.current?.raf(time * 1000); }
      gsap.ticker.add(onFrame);
      gsap.ticker.lagSmoothing(0);

      removeFrameRef.current = () => gsap.ticker.remove(onFrame);
    })();

    return () => {
      removeFrameRef.current?.();
      lenisRef.current?.destroy();
      lenisRef.current = null;
      document.removeEventListener('bridge-lock',   onBridgeLock);
      document.removeEventListener('bridge-unlock', onBridgeUnlock);
    };
  }, []);

  return <>{children}</>;
}
