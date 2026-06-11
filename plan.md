# Plan: Vidhu Sarwal Portfolio — Build Plan

## Context

Building a single-narrative scroll portfolio for Vidhu Sarwal from scratch. The site uses a stylized 3D single-board computer (SBC) as the visual storytelling vehicle for the candidate's work history. Aesthetic benchmark: [vicharak.in](https://vicharak.in) — technical, premium, restrained. Every animation serves narrative; nothing is decorative. Three design rules override everything: restraint over abundance, motion serves story, black is the canvas.

The working directory is empty. This plan starts from `npx create-next-app`.

---

## SBC / Blender Decision

**Blender is not required.** The spec says the model is "all primitives: rounded cubes, beveled edges, simple materials." That is exactly what React Three Fiber + drei's `RoundedBox` does natively in code.

**Build the SBC procedurally in R3F:**
- Named meshes (`pcb`, `soc`, `mem_left`, `mem_right`, `pin_header`, `expansion_connector`, `io_left`, `io_right`) come for free — we construct and name them in code, so the lighting-target system works automatically
- No `.glb` file, no Draco compression step, no external asset dependency
- Loads instantly (no fetch, zero network cost)
- Fully parameterizable — adjust proportions without re-exporting
- Total tri count will be well under the 20k spec limit

**Fallback:** If the procedural model looks noticeably worse than spec in practice, export to Blender for a one-session cleanup and re-import as `.glb`. But this should not be necessary.

**For now (Milestones 1–3):** a simple gray rounded rectangle in 3D space serves as the SBC placeholder. The full procedural SBC is built in Milestone 4.

---

## Tech Stack (as specified)

```
Next.js 15         App Router, TypeScript strict
Tailwind CSS v4    + CSS custom properties for runtime tokens
Three.js           via @react-three/fiber + @react-three/drei
GSAP 3             + ScrollTrigger + DrawSVG (all free/MIT as of 2024)
Lenis              @studio-freight/lenis  (smooth scroll normalization)
@react-three/postprocessing   (bloom only, intensity ≤ 0.3)
```

**Do NOT add:** Framer Motion, Locomotive Scroll, Spline, any UI component library, any orbital/solar-system animation, neon glows, glassmorphism, gradient backgrounds.

---

## Data / Content Architecture

All project and experience data lives in **`lib/projects.ts`** and **`lib/experience.ts`** as typed TypeScript arrays.

```typescript
// lib/config.ts  — read env flags once, export typed object
export const siteConfig = {
  showSamsung: process.env.NEXT_PUBLIC_SHOW_SAMSUNG !== 'false',
  showLKMP:    process.env.NEXT_PUBLIC_SHOW_LKMP    !== 'false',
  showGSOC:    process.env.NEXT_PUBLIC_SHOW_GSOC    !== 'false',
};
```

Renderers iterate arrays and skip entries where `siteConfig.show*` is false. No per-project conditional JSX.

---

## Milestones

---

### Milestone 1 — Foundation + Static Skeleton + Vercel Deploy

**Goal:** A deployed, readable, scrollable site. No animations. Every section has real content. Typography, color, spacing, and grid are correct.

**Work:**
1. `npx create-next-app@latest` — TypeScript strict, App Router, Tailwind v4, no ESLint auto
2. CSS custom properties for the full color system (`--bg-base`, `--bg-elevated`, `--border-rest`, `--border-active`, `--text-primary`, `--text-secondary`, `--text-tertiary`, `--accent`)
3. `next/font/local` for Cabinet Grotesk (download from Fontshare), Google Fonts for Inter, `next/font` for JetBrains Mono. Clamp-based type scale.
4. 12-column grid util, 24px gutter, 1440px max-width, 80px side margins
5. `lib/config.ts` — `siteConfig` object from env vars
6. `lib/projects.ts` — 5 projects as typed array with `configKey` field for filtering
7. `lib/experience.ts` — 3 experience entries (Samsung, GSoC, LKMP) with visibility flags
8. Static layouts for all 6 sections (01 HERO through 06 CONTACT) — semantic HTML, real copy from spec, no animation placeholders yet
9. `.env.local` with all three `NEXT_PUBLIC_SHOW_*` flags set to `true`
10. Vercel project created, deploy wired to repo, live URL confirmed

**Demo criteria:** Open the live URL. All 6 sections are visible by scrolling. Typography is correct (Cabinet Grotesk headings, JetBrains Mono on labels). Background is `#080808`. No gradient, no glassmorphism, no template feel.

**Content dependency note:** Experience section dates and 2-line descriptions need confirmation from Vidhu before Milestone 5. Add placeholders from the spec for now.

---

### Milestone 2 — Hero + Custom Cursor

**Goal:** The hero section is fully alive. Canvas grid reacts to the mouse. Text reveals on load. Custom cursor works.

**Work:**
1. Canvas 2D grid wall (`app/components/GridWall.tsx`):
   - 28px cells desktop / 20px mobile, 6px gap, 6px corner radius
   - lerp-based brightness falloff (radius 180px, smooth cubic, lerp factor 0.15)
   - `pointer-events: none` — never blocks content clicks
   - `prefers-reduced-motion`: static, no mouse reaction
   - Touch devices: static (no fake cursor)
   - Window resize: recompute grid, don't scale
2. Hero text GSAP SplitText reveal — characters drop in from `y: 40px, opacity: 0`, stagger 0.04s, `power3.out`, total < 700ms
3. Custom cursor (`app/components/Cursor.tsx`):
   - 6px dot, no lerp, `--text-primary`
   - 36px ring, lerp 0.12, `--border-active`
   - Hover any interactive: ring → 60px, `--accent`
   - Press: ring → 24px
   - `@media (hover: hover)` only — disabled on touch
4. Scroll hint text (hero bottom-left), fades after first scroll interaction

**Demo criteria:** Mouse over the hero. Grid cells glow around the cursor with smooth inertia. Name reveals on page load. Cursor ring trails behind the dot. On mobile, grid is static and custom cursor doesn't appear.

---

### Milestone 3 — Scroll Infrastructure + Persistent UI

**Goal:** Smooth scroll works. The scroll spline appears. Section counter updates. All pinning skeletons are wired.

**Work:**
1. Lenis smooth scroll — initialized in root layout, RAF loop set up correctly alongside GSAP ticker
2. GSAP ScrollTrigger synced to Lenis (the `lenis.on('scroll', ScrollTrigger.update)` bridge)
3. Scroll spline (`app/components/ScrollSpline.tsx`):
   - Fixed right edge, 24px from edge, vertically centered, 50vh height
   - SVG path — gentle S-curve (not straight)
   - Accent ice blue 6px circle on path at scroll progress position
   - Path behind dot: 60% opacity; path ahead: 15% opacity
   - GSAP DrawSVG + MotionPath scrubbed by scroll progress
   - Hover: circle → 9px, tooltip shows section name
   - Hidden in section 01 (scroll hint serves that role)
4. Persistent nav overlay:
   - Top-left: `VS.` monogram linking to top
   - Top-right: `02 / 06` section counter, updates on section entry
5. Section pinning skeletons for §02 (transition), §03 (SBC showcase), §04 (horizontal timeline) — empty divs with correct scroll-distance definitions so scroll distance budget is set
6. Loading sequence:
   - Page loads with hero layout hidden, grid dim
   - 1px line grows 0→100% width at bottom of viewport
   - Line retracts to center and disappears
   - Hero animation fires
   - Minimum 800ms loader even on fast connections

**Demo criteria:** Scroll through the page with smooth scroll inertia. The ice blue dot moves along the S-curve spline as you scroll. Section counter changes on each section. The 1px loader plays on first visit. Pinned sections hold the viewport as expected (content can still be placeholder).

---

### Milestone 4 — 3D Scene: Procedural SBC + Section 03

**Goal:** The SBC is on screen, the Section 02 transition fires, project cards scroll beside the board, the rim light moves between components, and the perimeter trace draws.

**Work:**

**Procedural SBC model (`app/components/SBC/SBCModel.tsx`):**
- Build all named meshes in R3F using `drei` `RoundedBox` + standard `BoxGeometry`:
  - `pcb`: 85×56×1.5 proportion, cornerRadius 3, `meshStandardMaterial` roughness 0.7 metalness 0.0, color `#181818`
  - `soc`: centered square chip, roughness 0.4 metalness 0.1, matte black
  - `mem_left`, `mem_right`: flanking rectangles, same treatment
  - `pin_header`: single row of ~20 cylinder pins, color `#9C7B3C`, roughness 0.3 metalness 0.8
  - `expansion_connector`: small block top-right
  - `io_left`, `io_right`: USB-C-style trapezoids on right edge
  - Mounting holes: four small inset circles at corners
  - Subtle PCB trace lines: 1px geometry or a small canvas-generated 1K normal map

**Scene setup (`app/components/SBCScene.tsx`):**
- `<Canvas frameloop="demand">` — `invalidate()` called only on state change
- Key light: soft top-front-left, `#F4F4F2`
- Rim light: hard behind-right, `#C8E4FF`, intensity driven by scroll/mesh-target state
- Bloom post-processing via `@react-three/postprocessing`, intensity ≤ 0.3
- Faint contact shadow under board
- FOV 35°
- Dynamically imported via `next/dynamic` with `ssr: false`

**Section 02 Transition choreography:**
- Pinned scroll section, ~150vh scroll distance
- 0–15%: grid disassembles (cells lift, fade, stagger from cursor position)
- 10–35%: deep black, faint drifting depth-cue particles
- 25–50%: SBC fades in from black, far away, rotating
- 40–70%: camera dollies in `(0,0,12)` → `(0.5, 0.3, 4.5)`; SBC rotates to 3/4 hero angle
- 60–90%: thin label types out `S Y S T E M S · 2 0 2 3 — 2 0 2 6`
- 85–100%: camera settles, SBC locked at hero pose
- All progress values scrubbed to scroll position

**Section 03 SBC Showcase:**
- SBC pinned in left 55%; project cards scroll in right 40%
- Continuous slow Y-rotation (~6°/s), pauses if no scroll for 3 seconds
- Rim light interpolates between named mesh positions via smooth arc (not teleport)
- Project cards: `y: 40px → 0, opacity: 0 → 1`, 600ms `power2.out` on enter; `y: 0 → -40px` 400ms on exit
- Perimeter trace line (`drei <Line>`) draws 0→100% as scroll progresses through §03, accent color, 0.4 opacity, leading dot
- Samsung card respects `siteConfig.showSamsung`
- Heat-shimmer particles (dozen particles, 1–2s) on SoC when Samsung card is active
- Mobile: cards stack below SBC; bloom disabled; trace is a static outline

**Demo criteria:** Scroll into Section 02. Grid dissolves. SBC arrives from black in a smooth camera push. Section 03: scroll shows one project card at a time; the ice-blue rim light visibly shifts to a different board component for each card; the perimeter trace draws around the PCB edge as you scroll. On mobile, cards appear below the board.

---

### Milestone 5 — Experience Timeline + Tech Constellation

**Goal:** Sections 04 and 05 are complete and polished.

**Work:**

**Section 04 — Experience Timeline:**
- Horizontal scroll via ScrollTrigger (`pin: true, scrub: true`) — vertical scroll converts to horizontal pan
- Timeline line rendered as SVG with stroke-dashoffset animated left-to-right by scroll
- 3 cards: Samsung (conditional on `siteConfig.showSamsung`), GSoC (BeagleBoard.org), LKMP
- Each card: monochrome company logo (SVG), role, dates, 2-line description, tech tags
- Card hover: same proximity-glow border treatment as hero grid cells
- When Samsung hidden: timeline collapses to 2 entries, line redistributes
- Experience data from `lib/experience.ts`

**Section 05 — Tech Constellation:**
- Full-viewport 2D canvas (or SVG) with 4 node clusters positioned per spec:
  - Systems (top-left): C, C++, Linux Kernel, Buildroot, Embedded C, ARM, I2C/SPI/UART, Device Tree
  - Backend (top-right): Go, Python, FastAPI, async, WebSockets, REST, gRPC
  - AI/ML (bottom-right): LangGraph, LangChain, ChromaDB, RAG, Embeddings, Qwen-VL, Tree-sitter
  - Infra (bottom-left): Docker, Kubernetes, GitHub Actions, PostgreSQL, MongoDB, Redis
- Connection lines at `rgba(255,255,255,0.12)`, only between genuinely related nodes
- Very slow drift, 60+ second cycle
- Node hover: hovered node full opacity, connected nodes 50%, others 30%, connection lines brighten
- Tooltip on hover: tech name + one-line context
- Mobile fallback: typographic list, 3 columns, mono caps, hover highlight

**Demo criteria:** Scroll into Section 04. Viewport locks and timeline pans horizontally. Timeline line draws left-to-right. Cards show correct experience entries. Section 05: nodes are positioned in clusters, hover highlights connected nodes, drift is barely perceptible. Mobile shows the typographic fallback.

---

### Milestone 6 — Polish, Accessibility, Performance

**Goal:** Site passes the "editorial design system" test. Meets all performance budgets. Degrades gracefully.

**Work:**

**Reduced-motion fallbacks:**
- Grid: static, no mouse reaction
- SBC: renders but rotation paused, rim light snaps (no interpolation), trace is static complete outline
- Constellation: no drift
- Scroll spline: vertical line + static dot
- Custom cursor: disabled

**Accessibility:**
- 3D canvas: `aria-hidden="true"`
- All project content in semantic HTML (`section[aria-labelledby]`, h2/h3/p/ul)
- Tab order: skip-nav → hero CTA → project cards → contact links
- Visible focus rings: `outline: 2px solid var(--accent); outline-offset: 4px`
- Contact email: `mailto:` + click-to-copy with "copied" microfeedback

**Performance:**
- Three.js and R3F components behind `next/dynamic` with `ssr: false`
- GSAP plugins imported on-demand (not in root layout)
- Fonts: `font-display: swap`, preload only weights in use
- Lighthouse audit ≥ 85 mobile
- Bundle analysis — JS < 350KB gzipped
- Test on real mobile device (or BrowserStack)

**Final test (§18):**
- Screenshot every section at 1440px and 375px
- Open sequence and verify: cohesive editorial system, no frame looks like a template

**Demo criteria:** Lighthouse ≥ 85 mobile. `prefers-reduced-motion` disables all animation correctly. Tab navigation reaches all interactive elements. Site looks intentional in every screenshot at both widths.

---

## File Structure (key files)

```
app/
  layout.tsx              root layout with Lenis + custom cursor
  page.tsx                assembles all 6 section components
  components/
    GridWall.tsx           hero canvas grid
    Cursor.tsx             custom cursor
    ScrollSpline.tsx       right-edge scroll indicator
    SBCScene.tsx           R3F canvas wrapper (dynamic import)
    SBC/
      SBCModel.tsx         procedural named-mesh SBC geometry
      RimLight.tsx         movable accent rim light
      PerimeterTrace.tsx   drei <Line> draw-on-scroll
    sections/
      Hero.tsx
      Transition.tsx       §02 pinned animation
      SBCShowcase.tsx      §03 with project cards
      Experience.tsx       §04 horizontal timeline
      TechStack.tsx        §05 constellation
      Contact.tsx          §06
lib/
  config.ts               siteConfig from env
  projects.ts             5 projects as typed array
  experience.ts           3 experience entries
  fonts.ts                next/font declarations
public/
  fonts/                  Cabinet Grotesk local files
  logos/                  monochrome SVGs (Samsung, GSoC, BeagleBoard, etc.)
```

---

## Open Content Dependency

**Experience section details** (Section 04 dates, 2-line descriptions, exact tech tags for Samsung/GSoC/LKMP) — the spec has headings but not body copy. Needed before Milestone 5 ships. Current plan: use reasonable placeholder text from the spec.

---

## What the Site Must Never Do (hard constraints)

Gradient backgrounds · glassmorphism · neon glow · Lottie · typewriter on body text · solar-system orbit animation · AI-generated 3D models · Framer Motion · Locomotive Scroll · Spline · any UI component library · particle backgrounds behind content · bouncing scroll arrow · more than 3 colors on screen at once.
