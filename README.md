# Front-end playbook for a single-page portfolio

Everything you need to understand, extend and ship a production portfolio front-end
that renders CMS content: one HTML page, no framework, two hand-written modules, a
hanging-print media gallery, eight themes, and the browser gates that keep it honest.

This repository is documentation, not a template. It is the engineering knowledge base
behind a live site, written so that a new maintainer (or an AI coding agent) can change
it without breaking it.

![Hero](docs/images/01-hero.png)

| | |
|---|---|
| **27 screenshots** | every section, eight themes, mobile, both media galleries, two extra entry points |
| **2 screen recordings** | the gallery being dragged, and all eight themes cycling |
| **15 documents** | about 4,300 lines of cited engineering notes |
| **3 reference tables** | DOM hooks, CSS tokens, QA handles |
| **1 capture tool** | reproduces every image in this repo, with a redaction gate |

---

## Who this is for

- **A developer inheriting a portfolio, landing page or agency template** built as
  plain HTML plus a little TypeScript, where the design must not change while the
  content moves into a CMS.
- **An AI coding agent** working inside that codebase. `SKILL.md` is written to be
  loaded as project instructions.
- **A buyer evaluating the build.** The screenshots, the measured performance numbers
  and the pitfall list show what the code actually does, not what a sales page claims.

Not for you if you want a component library, a framework starter, or a site you can
rebuild in an afternoon from a template. This is the opposite: a small number of large
files, heavily optimised, with the trade-offs written down.

## What the site is

One `index.html` holds the whole public page: markup, the design tokens, a Tailwind CDN
config, and a large inline renderer that paints CMS content into `#cms-*` containers.
Two TypeScript modules are loaded as ES modules:

- `src/cms/public-content.ts` reads published rows over PostgREST and hands them to
  `src/cms/shape.js`, a pure mapper that produces the shape the renderer expects.
- `src/gallery/motion-gallery.ts` is a hanging-print carousel with spring physics, used
  by both `#motion` (video) and `#render-3d` (stills).

Everything else is CSS, a spring integrator, and puppeteer tests.

```mermaid
flowchart LR
  DB[(PostgREST: published rows)] --> L[public-content.ts]
  J[static api/*.json fallback] --> R
  L --> S[shape.js mapper]
  S --> D[legacy shape: textData / imgData / settingsData]
  D --> R[inline renderer paints #cms-*]
  DB --> G[motion-gallery.ts]
  G --> M[#motion and #render-3d]
```

## Screenshots

### The page

| | |
|---|---|
| ![About and education](docs/images/02-about-education.png) | ![Skills](docs/images/03-skills.png) |
| ![Works carousel](docs/images/04-works-carousel.png) | ![Work detail](docs/images/05b-work-modal-body.png) |
| ![Photography](docs/images/06-photography.png) | ![Contact](docs/images/10-contact.png) |

### The gallery

![Motion gallery](docs/images/07-motion-gallery.png)

![Gallery drag](docs/media/gallery-drag.gif)

Higher quality: [gallery-drag.mp4](docs/media/gallery-drag.mp4), 2.3 seconds, 172 KB.

A drag swings the whole clothesline. Each print keeps its own phase of ambient breeze,
and the active print is exactly still, because the breeze amplitude is gated by how
active the print is. The clip is a real recording of the component.

### Eight themes

| | | | |
|---|---|---|---|
| ![forest](docs/images/15-theme-forest.png) | ![light](docs/images/16-theme-light.png) | ![aleksandria](docs/images/17-theme-aleksandria.png) | ![glacier](docs/images/18-theme-glacier.png) |
| ![neon tokyo](docs/images/19-theme-neon-tokyo.png) | ![abyss](docs/images/20-theme-abyss.png) | ![sunset](docs/images/21-theme-sunset.png) | ![monochrome](docs/images/22-theme-monochrome.png) |

![Theme cycle](docs/media/theme-cycle.gif)

Higher quality: [theme-cycle.mp4](docs/media/theme-cycle.mp4), 6.1 seconds, 596 KB.

Every theme is a variable block, so no component knows about colours. Adding a ninth
theme is four edits, documented in the cookbook.

### Mobile

| | | |
|---|---|---|
| ![Mobile hero](docs/images/23-mobile-hero.png) | ![Mobile works](docs/images/24-mobile-works.png) | ![Mobile gallery](docs/images/25-mobile-gallery.png) |

### Extra entry points

| | |
|---|---|
| ![Aru Meet](docs/images/27-meet.png) | ![Suitability SDSS](docs/images/28-suitability.png) |

Two standalone pages ship from the same build, documented in
[EXTRA-ENTRIES.md](docs/EXTRA-ENTRIES.md).

Full tour with captions: [docs/SCREENSHOTS.md](docs/SCREENSHOTS.md).

## What is inside

| Document | What you get |
|---|---|
| [SKILL.md](SKILL.md) | The agent playbook: layers, invariants, hook map, verification protocol, pitfall shortlist |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Entry points, module graph, boot sequence, fallback layers, build pipeline |
| [docs/RENDERING.md](docs/RENDERING.md) | Rows to legacy shape to DOM: the mapper, the description grammar, sanitisation, the carousel and modal |
| [docs/GALLERIES.md](docs/GALLERIES.md) | The hanging-print gallery: layout math, drag, breeze physics, rotation, reduced motion |
| [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) | Colour roles per theme with measured contrast ratios, type scale, spacing, elevation, motion language |
| [docs/COMPONENTS.md](docs/COMPONENTS.md) | Section-by-section inventory: DOM contract, source field, states, rendering range |
| [docs/THEMING.md](docs/THEMING.md) | Token layers, and the Tailwind CDN constraint that makes `prose` inert |
| [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) | What the site does, and an honest list of where it falls short |
| [docs/PERFORMANCE.md](docs/PERFORMANCE.md) | Measured bundle sizes, animation budgeting, font strategy, improvement list |
| [docs/SEO-AND-META.md](docs/SEO-AND-META.md) | Every head tag, what it does, and the domain change checklist |
| [docs/COOKBOOK.md](docs/COOKBOOK.md) | Twelve worked recipes, each with its verification command |
| [docs/EXTRA-ENTRIES.md](docs/EXTRA-ENTRIES.md) | The two standalone pages that share the build |
| [docs/BUILD-AND-DEPLOY.md](docs/BUILD-AND-DEPLOY.md) | Scripts, entry points, Cloudflare Pages, custom domain verification |
| [docs/TESTING.md](docs/TESTING.md) | Node suites and puppeteer gates, and what each one proves |
| [docs/PITFALLS.md](docs/PITFALLS.md) | Numbered failures with the symptom each one prevents |
| [references/](references/) | DOM hooks, CSS tokens per theme, QA handles for browser tests |
| [tools/capture.mjs](tools/capture.mjs) | Reproduces every screenshot and clip, with a redaction gate |
| [LISTING.md](LISTING.md) | Marketplace copy: title, long description, pricing tiers, FAQ, and the claims to avoid |
| [CHANGELOG.md](CHANGELOG.md) | What changed in each release |

## How to use it

If you are an agent, load in this order and stop as soon as the task is covered:

1. `SKILL.md` for the rules and the map.
2. The one topic document that matches the task.
3. `references/*` for exact identifiers.
4. `docs/PITFALLS.md` before you call the change done.

If you are a human, start with the screenshots, then `docs/ARCHITECTURE.md`, then the
topic that matches what you want to change. The cookbook is the fastest route from
"how do I add a work card" to a correct diff.

## What makes this documentation different

- **Every claim is cited.** `src/gallery/motion-gallery.ts:108` means you can open the
  file and check the sentence in seconds. Line numbers drift, the identifier does not.
- **Failures are documented, not hidden.** The `prose` classes do nothing. A rotated
  element reports a rotated bounding box. Two class toggles have no CSS. There is a
  measured list of accessibility gaps. A buyer who knows the flaws can estimate the
  work, a buyer who does not cannot.
- **Media is reproducible.** `tools/capture.mjs` regenerates all 31 assets from a local
  build and refuses to write a file while a known identity string survives redaction.

## Scope

This repo documents the public front end. The admin dashboard, the database schema, the
RLS policies and the migration tooling live in
[supabase-portfolio-cms](https://github.com/fachrur1/supabase-portfolio-cms), which also
ships a credential-free demo harness that reproduces the build these screenshots came
from.

## Conventions used in these docs

- Citations are `path:line` relative to the site repository root, for example
  `src/gallery/motion-gallery.ts:947`. When a line has moved, search for the cited
  identifier.
- The site owner and their content are never quoted. Content is called "CMS rows", and
  the production domain and the hosting project name are kept out of the text.
- Diagrams are mermaid code fences and render on GitHub.
- "Renderer" means the inline `<script>` at `index.html:1542-2289`. "Gallery" means
  `src/gallery/motion-gallery.ts`. "Shape" means `src/cms/shape.js`.

## Licence

MIT. You can use the text, the diagrams and the reference tables in your own project,
commercial or not. Attribution is appreciated, not required.

The screenshots show a demo dataset with invented content. No personal data from the
live site appears in this repository.