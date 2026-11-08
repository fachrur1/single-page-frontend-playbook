# Extra entries

The Vite build emits four HTML documents. One is the public page. One is the admin
dashboard. The other two are demo pages that ship from the same build, share the
same domain, and are not linked from the public page at all: `meet/` and
`suitability-land-for-RE/`.

They are not sections of the single page and they do not import a single module
from `src/`. Each is one self contained HTML file with its own inline CSS and
inline JavaScript. Read this before touching either, because nothing in the
public page's tests covers them.

## What ships

| Entry key | File | Size | Loads | Talks to a backend |
|---|---|---|---|---|
| `main` | `index.html` | 2,986 lines, 196 KB | Tailwind CDN, modules | Supabase or `api/*.json` |
| `admin` | `admin/index.html` | SPA | own modules | Supabase |
| `meet` | `meet/index.html` | 1,055 lines, 46 KB | Tailwind CDN, Daily SDK | `POST /api/room` |
| `suitability` | `suitability-land-for-RE/index.html` | 1,591 lines, 93 KB | Tailwind CDN, Chart.js, Lucide, three.js | static JSON plus OBJ |

All four are declared in `vite.config.ts:19-24` under `build.rollupOptions.input`.
That is the whole inclusion mechanism: multi page mode, one input per document.
No shared chunk is produced for the two demos because neither imports a module
from the project, so each is emitted as HTML only.

## Rules that apply to both

- **No CMS.** Neither reads `api/data.json`, `api/settings.json`, or Supabase.
  Copy changes are source edits, and they will not appear in the admin.
- **Own palette.** Neither loads `--color-*` tokens and neither carries
  `data-theme`. Both hardcode their colours inline, so the eight-theme switcher
  has no effect on them.
- **Same Tailwind pin.** Both load `cdn.tailwindcss.com/3.4.17`, the same version
  as `index.html:24`. Three copies of that URL now exist; bumping one and not the
  others silently splits the design system.
- **No tests.** `tests/public-smoke.mjs` opens `/` and `/admin/` only.
  `tests/motion-gallery.mjs` and `tests/render3d-gallery.mjs` drive
  `window.MotionFrames` / `window.RenderFrames` on the main page.
- **Unlisted.** `index.html` contains no link to `/meet/` or
  `/suitability-land-for-RE/`. Grep for either string in `index.html` returns
  nothing. They are reachable only by typing the URL.

---

## meet/

### What it does

A working video meeting demo called Aru Meet. Three states in one page: a lobby
with a local camera preview and mic/cam toggles (`meet/index.html:341-370`), a
join form that accepts a room URL or a `?room=` parameter
(`:521-536`, `:675-679`), and a call room with participant tiles, mute, camera,
screen share, chat and leave (`:404-500`).

It is not a mockup. Room creation is real:

1. `handleCreate()` posts to `/api/room` (`meet/index.html:654`).
2. That route is a Cloudflare Pages Function, `functions/api/room.ts:1`, which
   fails fast when `env.DAILY_API_KEY` is missing (`:5-10`).
3. It creates a room with a two hour expiry, ten participant cap, chat and screen
   share enabled (`functions/api/room.ts:12-19`), then returns the Daily URL.
4. The page joins it with the Daily SDK call object
   (`meet/index.html:708`) and rewrites the URL to `?room=<url>` so the link is
   shareable (`:664`).

Joining by URL works without creating anything, which means the page is usable
as a client for any existing Daily room.

### How it is reached

Built output is `dist/meet/index.html`, served at `/meet/` by Cloudflare Pages.
There is no link from the public page, and no card in Works points at it. It is
also not in `sitemap` or navigation.

The room endpoint only exists where Pages Functions run. A plain static host
serves the HTML and returns 404 for `/api/room`, so Create New Room fails with a
toast while Join by URL still works.

### Drift risk

- **Unpinned SDK.** `https://unpkg.com/@daily-co/daily-js` (`meet/index.html:15`)
  resolves to whatever is latest. A major release can change the call object
  API and break the page with no commit in this repo.
- **Secret not documented.** `DAILY_API_KEY` appears in `functions/api/room.ts:5`
  and nowhere in `.env.example`, so a new environment looks correctly configured
  and fails at the first room creation.
- **No way home.** There is no link back to `/`. Landing on `/meet/`
  requires editing the URL to get back to the public page.
- **Design drift is structural.** The page has its own type scale, its own glass
  classes and an indigo accent (`rgba(99, 102, 241, 1)`,
  `meet/index.html:25`), so it cannot inherit a theme change even if the rest of
  the site moves.

---

## suitability-land-for-RE/

### What it does

A spatial decision support page for renewable energy land suitability in Kulon
Progo. It renders a 3D terrain model with candidate markers, a ranked candidate
list with technology filters, an MCDA weight simulator with live score
recalculation (`suitability-land-for-RE/index.html:818`), a comparison tab with a
radar chart (`:1294`), and a screenshot export (`:1560`).

The scoring is client side. `points.json` ships with `raw_score`,
`score_percent`, `criteria` and `rank` already computed, and the weight sliders
recompute from the raw criteria rather than from a server
(`:366-393`, `:818-850`).

### Files it depends on

| Asset | Referenced at | Notes |
|---|---|---|
| `public/assets/data/points.json` | `:730` | 80 candidate records, absolute path |
| `public/assets/models/pltmh_kulon_progo.obj` | `:762` | 7.6 MB mesh |
| `public/assets/models/pltmh_kulon_progo.mtl` | `:756` | material list |
| `public/assets/models/Terrain_DEM_tile_material.jpg` | via the MTL | 3.5 MB texture |

The loader sets `setPath('/assets/models/')` before both loads
(`:751`, `:760`), so the paths are root absolute and survive being served from a
subdirectory. `public/` is copied verbatim into `dist/` on every build, which
means those 11 MB ship whether or not anyone opens this page.

### How it is reached

Built output is `dist/suitability-land-for-RE/index.html`, served at that exact
folder path. The folder name is part of the public URL: renaming the directory
requires a redirect. It carries one link back to the public page, an anchor to `/`
at `:145`.

### Drift risk

- **Hardcoded counts.** The UI says `0/65` (`:215`) and "across all 65 sites"
  (`:338`); the dataset has 80 records. Open it with every filter enabled and the
  counter reads `80/65`. Copy and data are separate sources with nothing checking
  them.
- **three.js is pinned by hand.** The import map points at
  `three@0.152.2` (`:50-57`), which is also why `vite.config.ts:13-18` marks
  `three` external. That external list exists so the main page never bundles a 3D
  renderer; it also means a stray `import 'three'` added anywhere in `src/` will
  resolve to nothing at runtime instead of failing the build.
- **Four CDNs, no lockfile.** Tailwind (`:15`), Chart.js (`:44`), Lucide
  (`:47`) and three (`:53-54`) are all unpinned or tag-pinned, so the page's
  behaviour can change without a commit.
- **It is a page, not a section.** Every visual decision is local: Cinzel and
  Cormorant for display (`:12`), a parchment and amber palette, its own dark
  base (`#0b0d14`, `:62`). It will never follow a theme or a token change.

## Before changing either one

1. Open the built page, not the source: `npm run build` then
   `npx serve dist -l 5055`, and visit `/meet/` and `/suitability-land-for-RE/`.
2. Check the external dependency URLs still resolve. Both pages fail at runtime,
   not at build time, when a CDN path moves.
3. Grep the repo for the page that was touched. If the change is a URL or a folder
   name, look for hardcoded copies on the other entry, in `vite.config.ts:19-24`,
   and in the deploy command at `vite.config.ts:51`.
4. If the change is visual, decide whether it belongs to the demo or to the
   design system. Today they are separate on purpose; porting a demo into the
   token system is a project, not an edit.