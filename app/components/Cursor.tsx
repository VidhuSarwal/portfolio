'use client';

import { useEffect, useRef, useState } from 'react';

export default function Cursor() {
  const [hasHover, setHasHover] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const ringPosRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const isHoveringRef = useRef(false);
  const isPressedRef = useRef(false);

  useEffect(() => {
    setHasHover(window.matchMedia('(hover: hover)').matches);
  }, []);

  useEffect(() => {
    if (!hasHover) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Hide native cursor
    document.documentElement.style.cursor = 'none';

    function onMouseMove(e: MouseEvent) {
      posRef.current = { x: e.clientX, y: e.clientY };
      dot!.style.transform = `translate(${e.clientX - 3}px, ${e.clientY - 3}px)`;
    }

    function onMouseOver(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [role="button"], [tabindex]')) {
        isHoveringRef.current = true;
      }
    }

    function onMouseOut(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [role="button"], [tabindex]')) {
        isHoveringRef.current = false;
      }
    }

    function onMouseDown() {
      isPressedRef.current = true;
    }

    function onMouseUp() {
      isPressedRef.current = false;
    }

    function animate() {
      const LERP = 0.12;
      ringPosRef.current.x = ringPosRef.current.x + (posRef.current.x - ringPosRef.current.x) * LERP;
      ringPosRef.current.y = ringPosRef.current.y + (posRef.current.y - ringPosRef.current.y) * LERP;

      const rx = ringPosRef.current.x;
      const ry = ringPosRef.current.y;

      const size = isPressedRef.current ? 24 : isHoveringRef.current ? 60 : 36;
      const color = isHoveringRef.current ? 'var(--accent)' : 'var(--border-active)';

      ring!.style.transform = `translate(${rx - size / 2}px, ${ry - size / 2}px)`;
      ring!.style.width = `${size}px`;
      ring!.style.height = `${size}px`;
      ring!.style.borderColor = color;

      rafRef.current = requestAnimationFrame(animate);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseover', onMouseOver);
    window.addEventListener('mouseout', onMouseOut);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      document.documentElement.style.cursor = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', onMouseOver);
      window.removeEventListener('mouseout', onMouseOut);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      cancelAnimationFrame(rafRef.current);
    };
  }, [hasHover]);

  if (!hasHover) return null;

  return (
    <>
      {/* Dot — follows 1:1 */}
      <div
        ref={dotRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'var(--text-primary)',
          pointerEvents: 'none',
          zIndex: 9999,
          willChange: 'transform',
        }}
      />
      {/* Ring — follows with lerp */}
      <div
        ref={ringRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '1px solid var(--border-active)',
          pointerEvents: 'none',
          zIndex: 9998,
          willChange: 'transform, width, height',
          transition: 'width 0.2s ease, height 0.2s ease, border-color 0.2s ease',
        }}
      />
    </>
  );
}
