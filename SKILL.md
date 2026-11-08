---
name: single-page-frontend
description: Use when changing a CMS-driven single-page front end.
---

# Single-page CMS front end

Playbook for the public single-page site: `index.html` (markup + tokens +
inline renderer), `src/cms/*` (data), `src/gallery/*` (hanging-print carousel),
Vite build, Cloudflare Pages. Follow the rules; each one exists because breaking
it produces a bug that is hard to see on a fast machine.

## 1. Which layer the change belongs to

| Layer | Files | The change belongs here if... |
|---|---|---|
| Content contract | `src/cms/public-content.ts`, `src/cms/shape.js` | the data is wrong, missing, or shaped differently than the DOM expects |
| Renderer | `index.html:1542-2289` (inline script) | a section is empty, a card is malformed, typography is off |
| Gallery | `src/gallery/motion-gallery.ts`, `motion-gallery.css`, `spring.ts` | `#motion` / `#render-3d` behaves wrongly |
| Theme | `index.html:181-305`, `index.html:541-605`, `index.html:102-179` | a colour, radius, or type scale changes |
| Build/deploy | `package.json`, `vite.config.ts`, `scripts/build-cms.ts` | output, entry points, or shipping changes |

Do not move work between layers. The renderer must not learn about database
columns, and `shape.js` must not learn about CSS.

### Document map

| If the task is about | Open |
|---|---|
| the visual system: colours, type, spacing, elevation | `docs/DESIGN-SYSTEM.md` |
| one section: its DOM contract, source field, states | `docs/COMPONENTS.md` |
| the CMS to DOM pipeline, description grammar, sanitiser | `docs/RENDERING.md` |
| the hanging-print gallery, drag, breeze, rotation | `docs/GALLERIES.md` |
| tokens, theme blocks, the Tailwind CDN constraint | `docs/THEMING.md` |
| focus order, ARIA, contrast, reduced motion | `docs/ACCESSIBILITY.md` |
| bundle sizes, animation budget, fonts | `docs/PERFORMANCE.md` |
| head tags, canonical URLs, domain changes | `docs/SEO-AND-META.md` |
| a concrete edit, step by step | `docs/COOKBOOK.md` |
| the two extra standalone pages | `docs/EXTRA-ENTRIES.md` |
| build, entry points, Cloudflare Pages | `docs/BUILD-AND-DEPLOY.md` |
| what to run before saying "done" | `docs/TESTING.md` |
| a symptom that has no explanation yet | `docs/PITFALLS.md` |

`LISTING.md` is marketplace copy, not engineering notes. `tools/capture.mjs`
regenerates every screenshot and clip.

## 2. Invariants (break these and the page silently degrades)

1. **`index.html` holds the page; there is no templating step.** Every section
   is static markup with an empty container (`#cms-works-container`,
   `#cms-skills-container`, ...) that the renderer fills. Add a section by adding
   markup plus a paint block at `index.html:1893-2206`; do not introduce a
   build-time HTML generator.
2. **Content flows one way: rows -> `buildContentShape()` -> legacy
   `{textData, imgData, settingsData}` -> DOM.** The legacy shape is a contract
   between three consumers (`src/cms/shape.js:12-25`): the renderer, the
   migration script, and `tests/shape.test.mjs`. Never change the shape to suit
   one consumer.
3. **All CMS text is untrusted.** Escape into templates with `esc()`
   (`index.html:1553`), then pass markdown/HTML through `sanitizeHtml()`
   (`index.html:1565`) via `md()` (`index.html:1598`). There is no framework
   framework escaping: the renderer builds strings and assigns `innerHTML`.
4. **The gallery is one class serving two sections, selected by
   `data-mf-source`.** `#motion` (`index.html:1137`) and `#render-3d`
   (`index.html:1176`) differ only by `SOURCE_CONFIG` (`motion-gallery.ts:313-328`).
   Fix behaviour in the class, never fork it per section.
5. **Colour comes from `var(--color-*)` only.** The Tailwind CDN config maps
   every palette name to a CSS variable (`index.html:107-155`), and themes
   redefine the variables (`index.html:188-301`, `541-605`). A hardcoded hex is a
   theme that renders wrong.
6. **A section that has no published content must hide itself.** No empty
   clothesline, no empty grid: `[data-mf-state="empty"]` is `display:none`
   (`motion-gallery.css:33`), and the renderer only paints containers when data
   exists (`index.html:1974`, `2172`).
7. **Verify with the gate that owns the change** (§7). "It looked fine in the
   browser" is not evidence on this project; two of its worst regressions
   (rotated media not filling its frame, drags swallowing clicks) only show up in
   the puppeteer gates.

## 3. Rendering pipeline (memorise the shape)

```text
Supabase REST (13 tables, published rows)      static api/*.json
        |                                            |
        +--> buildContentShape()  <------------------+
                 |  textData / imgData / settingsData
                 v
        loadContentBundle()  (index.html:1768)
                 v
        paint blocks, one per #cms-* container (index.html:1893-2206)
                 v
        openWorkModal(i) -> renderRichDescription() -> meta grid + cards + .md-body
```

- Loader priority and fallback: `index.html:1772-1790`. Supabase only if
  `isCmsConfigured()` (`public-content.ts:28`); otherwise `api/data.json`,
  `api/images.json`, `api/settings.json` are fetched with a cache-busting
  `?v=Date.now()`.
- Images resolve through `imgData` by key (`index.html:1890`): named slots such
  as `profile_image` (`shape.js:301`), plus synthesised per-row keys `wm{i}`,
  `wg{i}_{j}`, `em{i}`, `eg{i}_{j}`, `gal{i}` (`shape.js:318-357`, `414-418`).
- Descriptions are composed in `shape.js`, then re-parsed in the browser. Both
  ends agree on a small grammar: `Role:`-style meta lines and
  `Problem:`/`Action:`-style block headers (`shape.js:28-35`,
  `index.html:1622-1639`). A new key belongs in **all three** lists:
  `LEGACY_META_KEYS`, `META_KEYS`, `META_ORDER` (`index.html:1713`).

## 4. DOM hooks: use the existing ids, never invent new ones

Containers the renderer owns (full table in `references/dom-hooks.md`):

```text
#cms-hero-title  #cms-hero-subtitle  #cms-hero-desc
#cms-about-heading  #cms-about-body
#cms-education-container  #cms-skills-container
#cms-works-container  #works-prev  #works-next  #works-indicators  #works-counter
#cms-photography-heading  #cms-photography-description  #cms-photography-container
#cms-motion-heading  #cms-motion-description        (written by the gallery, not the renderer)
#cms-render3d-heading  #cms-render3d-description
#cms-orgs-container  #cms-contact-heading  #cms-contact-body
#cms-contact-email  #cms-contact-linkedin  #cms-contact-instagram
```

Rules:

- Paint into the `*-container` element and nothing else; the surrounding
  `<section>` carries layout, spacing and the reveal animation.
- Use `textContent` for plain strings (site copy) and `innerHTML` only for
  sanitised markdown (`md()`), never for raw rows.
- `[data-cms-id]` is a declarative image slot (`index.html:1893-1901`): add the
  attribute and the renderer rewrites `src`/`srcset` from `imgData`.
- `data-mf-*` attributes belong to the gallery (`data-mf-stage`, `data-mf-prev`,
  `data-mf-next`, `data-mf-counter`, `data-mf-ticks`, `data-mf-live`,
  `data-mf-heading`, `data-mf-description`, `data-mf-skeleton`). The gallery
  queries them by name in its constructor (`motion-gallery.ts:421-440`).

## 5. Gallery mechanics that must not be disturbed

- **One ring, two sections.** `loop` turns on at three or more prints
  (`motion-gallery.ts:477`); below three the carousel is bounded.
- **Layout is computed, never hardcoded.** `measure()` derives the stage height,
  print step, max media height and the SVG line path from viewport height, the
  scoped CSS custom properties `--mf-line-top` / `--mf-sag` / `--mf-caption-h`,
  and each print's aspect ratio (`motion-gallery.ts:785-848`). Change sizes in
  CSS; `measure()` follows.
- **Physics is springs, not timeouts.** `Spring` (`spring.ts:31-97`) integrates
  with semi-implicit Euler; the rAF loop stops when everything is at rest
  (`motion-gallery.ts:989-1007`). Do not add `setTimeout`-driven animation.
- **Ambient breeze is bounded and gated.** Amplitudes are `WIND_ROT = 2.2` deg,
  `WIND_DX = 2.6` px, `WIND_DY = 2.0` px at the far edge and exactly `0` on the
  active print, because amplitude is `(1 - activity)^1.35`
  (`motion-gallery.ts:108-110`, `947-972`). It only runs while the stage is on
  screen, the tab is visible, and reduced-motion is off (`breezeActive()`,
  `motion-gallery.ts:975-981`).
- **Drag never uses `setPointerCapture`.** Listeners go on `window`
  (`motion-gallery.ts:1205-1210`) so the tap that follows a drag still reaches
  the play/fullscreen buttons. A drag that moved sets `suppressClick`, consumed
  in a capture-phase click handler (`motion-gallery.ts:1177-1186`).
- **Rotation changes the layout box, not just the transform.** 90/270 match the
  print ratio `1 / ratio` and counter-rotate the media
  (`motion-gallery.ts:701-708`, `motion-gallery.css:289-309`).
- **`prefers-reduced-motion` is a first-class mode.** Springs go instant
  (`motion-gallery.ts:470-473`), entrance and breeze collapse, the line draws
  immediately (`motion-gallery.css:681-688`).

## 6. Theming

- Two token layers: raw `--color-*` on `[data-theme]` blocks, then a Tailwind CDN
  `theme.extend.colors` map that points each utility at `var(--color-*)`
  (`index.html:102-179`). Utilities such as `bg-surface-container-high` and
  `text-on-surface-variant` are only aliases; the value lives in the theme block.
- Adding a theme is four edits: the variables (including `--primary-rgb`) in a
  theme block, a button in the desktop switcher (`index.html:974-998`), a button
  in the mobile switcher (`index.html:1025-1032`), and a `FELTS` entry
  (`index.html:2312-2321`). The switcher logic itself needs no change: it
  persists the name to `localStorage` and dispatches `themechange`
  (`index.html:2301-2328`).
- The page loads Tailwind from `cdn.tailwindcss.com` (`index.html:24`), which
  cannot register `@tailwindcss/typography`, so `prose` classes are inert;
  markdown typography comes from the hand-written `.md-body` stylesheet
  (`index.html:651-771`). Style new markdown constructs there.

## 7. Verification protocol

```bash
npm run typecheck                 # tsc --noEmit
node --test tests/shape.test.mjs  # 18 pure tests, no build needed
npm run build                     # build-cms.ts then vite build
node tests/public-smoke.mjs       # puppeteer against dist/ (starts its own server)
node tests/render3d-gallery.mjs   # needs TARGET=http://host:port of a served dist/
node tests/motion-gallery.mjs     # self-hosts dist/, generates ffmpeg fixtures
```

Match the gate to the change: shape/description logic -> `shape.test.mjs`; any
`#cms-*` section or modal -> `public-smoke.mjs`; gallery layout, drag or rotation
-> `render3d-gallery.mjs` and/or `motion-gallery.mjs`. Quote the actual pass/fail
output in the report; do not paraphrase it.

## 8. Publish checklist

- `npm run dev` runs `build-cms.ts` **then** Vite on port 3000
  (`package.json`, `vite.config.ts:6-8`). The API files are generated, so a stale
  `public/api/data.json` is a content bug, not a render bug.
- `npm run build` writes `dist/` (cleared first, `vite.config.ts:10-11`) with four
  HTML entries: `index.html`, `suitability-land-for-RE/`, `meet/`, `admin/`
  (`vite.config.ts:19-24`).
- Cloudflare Pages builds from the `main` branch; the deploy command and project
  name live in the dev-only plugin (`vite.config.ts:51`). Never deploy from a
  feature branch.
- After a deploy, verify the custom domain serves the new build. The canonical
  and Open Graph URLs are hardcoded in `<head>` (`index.html:8-21`), so a domain
  check is a human step, not a test.

## 9. Pitfall shortlist (full list: docs/PITFALLS.md)

1. `<img>` drag ghosts: set `draggable="false"` **and**
   `-webkit-user-drag: none` (`motion-gallery.ts:608-609`,
   `motion-gallery.css:203-218`).
2. Anchor jumps hide behind the fixed header: only `.mf-section` has
   `scroll-margin-top: 96px` (`motion-gallery.css:38`); other targets need the
   same treatment or offset scrolling.
3. Entrance animations need a scroll/rAF fallback, not just an
   `IntersectionObserver` (`motion-gallery.ts:508-516`).
4. `setPointerCapture` retargets the following click. Do not reintroduce it.
5. A rotated element's `getBoundingClientRect()` is the rotated box; assert on
   `offsetWidth`/`offsetHeight` for layout (`motion-gallery.ts:1489-1492`).
6. The print's aspect ratio lives on the inner `.mf-media`
   (`motion-gallery.css:249`), so converting media width to print width must add
   the paper chrome (padding + border) explicitly (`CHROME`,
   `motion-gallery.ts:95-97`).
7. Never assert on content values in a browser gate; assert self-consistency
   (counts vs counters), or stub the REST calls (`tests/motion-gallery.mjs:626-657`).
8. `var(--md-sys-color-*)` is used 10 times in `index.html` and defined nowhere;
   those declarations are dropped. Use `--color-*`.
9. Class toggles without CSS (`nav-hidden`, `active-link`, FAB `visible`) do
   nothing; the features they were meant to implement are dead
   (`index.html:2462-2475`, `2478-2495`, `2525-2529`).