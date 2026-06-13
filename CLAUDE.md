@AGENTS.md

# Portfolio — Claude Rules

## Stack

- **Next.js 16.2.9** App Router, TypeScript strict — read `node_modules/next/dist/docs/` before using any Next.js API
- **Tailwind CSS v4** (`@import "tailwindcss"`) — no `tailwind.config.js`, theme tokens live in `globals.css` under `@theme inline`
- **Fonts**: Space Grotesk (`--font-display`) for all UI, JetBrains Mono (`--font-jetbrains`) for monospace/labels
- **Canvas 2D API** for all animated components (Loader, KineticBasket) — no Three.js, no WebGL, no CSS transforms faking 3D
- **No animation libraries** — all motion is hand-rolled rAF loops with spring physics or easing functions

---

## File Map (critical files)

| File | Purpose |
|---|---|
| `app/layout.tsx` | Root layout — mounts Loader, CornerBrackets, MarginStatus, SmoothScroll |
| `app/globals.css` | All CSS custom properties (design tokens) — single source of truth for color/spacing |
| `app/components/Loader.tsx` | Blueprint loading screen — Canvas 2D, cipher reveal, curtain-up splash |
| `app/providers/LoaderContext.tsx` | `isDone` / `markDone()` — signals when loader finishes |
| `app/components/NavOverlay.tsx` | Fixed nav — dispatches `section-change` CustomEvent |
| `app/components/CornerBrackets.tsx` | Four fixed corner L-brackets, breathing animation, listens for `section-change` |
| `app/components/MarginStatus.tsx` | Bottom status bar — coordinates + SYS · NOMINAL |
| `app/components/KineticBasket.tsx` | Right-rail scroll indicator (visible only in `#sbc-showcase`) |
| `app/page.tsx` | Single-page layout with all section components |

---

## Design tokens — never hardcode these

Always use CSS custom properties. Never write raw hex or rgba unless inside a canvas `ctx` call.

```
--bg-base           #080808 (dark) / #F8F6F1 (light)
--bg-elevated       #0E0E0E / #EFECE5
--text-primary      #F4F4F2 / #1C1A17
--text-secondary    #8A8A88 / #6B6865
--text-tertiary     #4A4A48 / #B5B2AB
--accent            #C8E4FF / #2C5282
--border-rest       rgba(255,255,255,0.06) / rgba(0,0,0,0.07)
--border-active     rgba(255,255,255,0.45) / rgba(0,0,0,0.40)
--border-subtle     rgba(255,255,255,0.13) / rgba(0,0,0,0.10)
--frame-stroke      rgba(255,255,255,0.07) / rgba(0,0,0,0.06)
--margin-safe-area  clamp(32px, 4vw, 64px)
--corner-length     56px
```

---

## Architecture constraints

### Loader
- Lives at `app/components/Loader.tsx`, rendered first in `app/layout.tsx` inside `<LoaderProvider>`
- `position: fixed; inset: 0; z-index: 200` — covers entire viewport
- White background (`#ffffff`), black-only Canvas 2D animation
- Splash: `translateY(-100%)` curtain-up after 6 s, 550 ms transition
- **Dev**: never skips (no sessionStorage check in `NODE_ENV !== 'production'`)
- **Prod**: skips on repeat visits within same session via `sessionStorage.setItem('vx:bp', '1')`
- Canvas animation: outer square → zone corner brackets → extension lines (edges inward) → callout box → cipher scramble → glitch particles

### Margin system
- `--margin-safe-area: clamp(32px, 4vw, 64px)` is the single spacing unit used by all fixed UI
- NavOverlay, CornerBrackets, MarginStatus, KineticBasket all anchor to this var
- **Never** use hardcoded pixel offsets for fixed UI positioning

### Cross-component communication
- `NavOverlay` fires `document.dispatchEvent(new CustomEvent('section-change', { detail: n }))` when the active section changes
- `CornerBrackets` listens and pulses — no prop drilling, no shared state

### Canvas animation pattern
```ts
// Standard pattern for all canvas components:
const ro = new ResizeObserver(() => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; });
ro.observe(canvas);
// rAF loop with closure-scoped animId:
let animId = 0;
function draw(ts: number) { /* ... */ animId = requestAnimationFrame(draw); }
animId = requestAnimationFrame(draw);
return () => { cancelAnimationFrame(animId); ro.disconnect(); };
```

### Spring physics (used in KineticBasket)
```ts
// f = k*(target - pos); v = v*damping + f; pos += v
function springStep(pos: number, vel: number, target: number, k: number, d: number): [number, number] {
  const f = k * (target - pos);
  const v = vel * d + f;
  return [pos + v, v];
}
```

---

## Never touch

- **`app/providers/LoaderContext.tsx`** — stable API, only change if adding loader phases
- **`app/globals.css` token names** — renaming a CSS var breaks every component that references it; add tokens, never rename
- **`app/components/SmoothScroll.tsx`** — scroll behavior is load-bearing for KineticBasket and section observers
- **Canvas rAF cleanup** — always `cancelAnimationFrame(animId)` and `ro.disconnect()` in the useEffect cleanup. Missing either leaks memory
- **The `vx:bp` sessionStorage key** — if you rename it, production users who already have the old key set will see the loader on every visit until their session expires

---

## Aesthetic rules (enforce in all new code)

- **No neon, no glow, no drop-shadows** on UI chrome
- **No 3D transforms** on anything except the KineticBasket helix (which uses projected 3D math, not CSS `perspective`)
- **No animation libraries** — no Framer Motion, no GSAP, no anime.js
- All motion must feel **precise and controlled** — easing functions, not spring-bounced UI
- Loader and CornerBrackets are **black-only on white** — never use `--text-primary` or theme vars inside the loader canvas
- Monospace labels (coordinates, status) always use JetBrains Mono at 9 px, `letter-spacing: 0.14em`

---

## Brand

- **VX. Works** is the project's logo and wordmark (note the period after VX). Used in the canvas footer signal field and the footer bar logo mark. Never change the spelling or punctuation.

---

## Dev commands

```bash
# Dev server (Homebrew Node 22)
/opt/homebrew/bin/node node_modules/.bin/next dev

# Type check
/opt/homebrew/bin/node node_modules/.bin/tsc --noEmit

# Build
/opt/homebrew/bin/node node_modules/.bin/next build
```
