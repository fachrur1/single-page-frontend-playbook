# Testing

Two kinds of gate. Pure unit tests run under `node --test` with no browser and no
build. Browser gates drive a headless Chromium against a built `dist/` and assert
on live geometry. Use the browser gate when the change is visual or
interaction-related; a unit test cannot see a 2px misalignment or a swallowed
click.

## 1. Suites and how to run them

| Gate | Command | Needs | Asserts |
|---|---|---|---|
| Shape unit tests | `node --test tests/shape.test.mjs` | nothing | 18 tests over the row to shape mapper |
| Admin helper tests | `npm run test:cms` | nothing | shape plus seven `admin-*.test.mjs` suites (backend repository's subject) |
| Public smoke | `node tests/public-smoke.mjs` | `dist/`, puppeteer | page renders, modal opens, admin responds, no fatal console errors |
| 3D gallery | `TARGET=http://host:port/ node tests/render3d-gallery.mjs` | served `dist/`, puppeteer | mounts, size, rotation, drag, arrows |
| Motion gallery | `node tests/motion-gallery.mjs` | `dist/`, puppeteer, ffmpeg | 6-print ring, ratios, entrance, drag, video, a11y, empty state, mobile |

`npm run test:gallery` is an alias for the 3D gate. `npm run typecheck`
(`tsc --noEmit`) is not a test but belongs in the same loop.

Puppeteer is pinned in `devDependencies` (`puppeteer ^25`). The motion gate also
needs `ffmpeg` on `PATH` (`tests/motion-gallery.mjs:32-57`); without it the run
stops at fixture generation, before any assertion.

## 2. Unit tests: `tests/shape.test.mjs`

Eighteen tests, no fixtures, no network, ~300ms. Run against the source file
directly (`tests/shape.test.mjs:7-22` imports `../src/cms/shape.js`), which is
possible because the mapper is plain ESM with no dependencies.

| Group | Covers |
|---|---|
| primitives | `arr`, `yearOf`, `durationText`, `educationPeriod` (`:24-49`) |
| grammar detection | `hasMetaLine`, `hasBlockHeader`, `hasAnyMetaLine`, `extractMetaLines` (`:51-70`) |
| composition | self-describing bodies stay verbatim, narrative bodies get merged meta (`:72-92`) |
| meta block | opening meta line wins, mid-text meta is preserved, missing keys are added, no duplicates (`:94-118`) |
| full shape | `buildContentShape` ordering, skill grouping, empty input safety (`:120+`) |

These tests are the specification for the description grammar. If a browser gate
fails on a modal that shows no metadata, run this suite first: a change in
`shape.js` is the usual cause.

## 3. Browser gate: `tests/public-smoke.mjs`

Self-contained: it starts its own static server on an ephemeral port
(`tests/public-smoke.mjs:29-44`), serves `dist/`, and drives Chromium at
1440x900 (`:65`). It refuses to run if `dist/index.html` is missing (`:52-55`).

| Assertion | Line |
|---|---|
| hero title is filled from content | `:76-77` |
| container counts: education 2, skills >= 5, works >= 12, photography 6, organizations 2 | `:91-98` |
| works counter equals `1 / <slide count>` | `:96` |
| photography heading and description rendered | `:99-100` |
| about body rendered, contact email is a `mailto:` link | `:101-102` |
| modal opens with the first slide's own title, shows a `Role` meta and a `Problem` block | `:107-113` |
| a `[download]` anchor points at a PDF | `:117-118` |
| no fatal console errors (favicon/404/network failures filtered) | `:120-121` |
| `/admin/` responds 200, renders UI, no fatal errors | `:124-137` |

Two lessons are already baked into that file and should stay:

- Counts are asserted as ranges (`works >= 12`) while the counter is asserted
  against the count actually rendered (`:93-96`). Content lives in a database;
  a hardcoded total rots.
- The modal is checked against the **first visible slide's** title
  (`:104-111`), not a fixed project name, because projects and experiences share
  the carousel and order is data.

The education, photography and organization counts are the exception: they are
pinned to seed values (`:91`, `:97-98`). Changing the CMS seed means updating
those three lines.

## 4. Browser gate: `tests/render3d-gallery.mjs`

Runs three viewports in a loop (`tests/render3d-gallery.mjs:20-27`):

| Name | Size | Extra |
|---|---|---|
| desktop | 1440x950 | expects the tallest video print to grow at least 15% over a recorded baseline |
| laptop | 1280x800 | 5% growth |
| mobile | 390x844 | 5% growth, portrait floor scaled to 62% |

It needs an external server. Either:

```bash
npm run build
npx serve dist -l 5055
TARGET=http://localhost:5055/ node tests/render3d-gallery.mjs
```

or point `TARGET` at any host serving `dist/` (a Pages preview works). The
default when unset is `http://localhost:5055/` (`:17`).

| Group | Asserts |
|---|---|
| mount | section present, `data-mf-state="ready"`, prints exist, no `.mf-play`, every print is a still (`:87-91`) |
| images | every card decodes when it becomes active, via `goTo()` on the handle (`:96-126`) |
| layout | no horizontal overflow, portrait prints at least 440px tall on desktop (`:127-135`) |
| video gallery size | tallest `#motion` print meets the per-viewport growth target (`:137-143`) |
| rotation | injects one 9:16 print at 0/90/180/270 through `setData()` and reads back layout ratio, computed transform and whether the media fills the frame (`:146-188`) |
| drag guard | every `<img>` has `draggable === false` (`:193-207`) |
| navigation | arrow click advances, mouse drag advances, arrow works again right after a drag (`:209-247`) |

The rotation block is the cheapest way to verify the more confusing layout code:
it feeds the gallery a fixture instead of relying on published content.
`MIN_PORTRAIT_HEIGHT` is overridable by env (`:18`).

## 5. Browser gate: `tests/motion-gallery.mjs`

The deep one. It self-hosts `dist/` plus a fixture directory
(`:66-93`), generates real webm and png files at 16:9, 9:16, 1:1, 4:5 and 21:9
with ffmpeg (`:24-57`), and feeds six items to the gallery through
`window.MotionFrames.setData()` (`:155-186`). No database, no network content.

What it covers, by section:

| Group | Representative assertions |
|---|---|
| mount | section visible, six prints, counter `01 / 06`, CMS heading applied, prints opaque after entrance (`:262-266`) |
| layout | portrait narrower than landscape, 21:9 shorter than 16:9, exact 21:9 media ratio, viewport width cap, nothing overflows the stage (`:286-297`) |
| line geometry | entrance completed, active print centred, every print hangs from the line, clips straddle the line, neighbour partially visible and smaller (`:303-319`) |
| labels | three media badges, title rendered, long title clamps to two lines (`:324-333`) |
| navigation | `goTo`, next, prev, arrow keys, tick indicator, ring wrapping in both directions, buttons stay enabled at the ends (`:341-442`) |
| drag | 1:1 follow, release settles on a whole index, re-centring, backwards drag wraps into the end (`:463-483`) |
| playback | one video element per active print, plays, poster hidden, previous pauses on navigation, no duplicate elements, distant decoders released (`:517-550`) |
| ratio adoption | starts at 16:9, adopts the real ratio once metadata loads (`:578-579`) |
| fullscreen | request enters fullscreen (`:593`) |
| regression | works/photography/education/skills/organizations counts unchanged, navigation has no gallery link, `#motion` sits directly after `#photography` (`:609-620`) |
| empty state | all REST calls stubbed to `[]`, section keeps `data-mf-state="empty"` and stays `display:none` (`:626-657`) |
| mobile | 390x844 (`:660+`): prints mounted, no horizontal overflow, active print centred, portrait ratio kept, fits the stage, still hangs from the line (`:690+`) |

The empty-state block is the pattern to copy for any content-dependent
assertion: request interception answers Supabase URLs with `[]` plus permissive
CORS headers (`:631-651`), so the test never depends on what is published.

## 6. Running the browser gates locally

1. `npm run build`. The gates need `dist/` and the generated `dist/api/*.json`.
2. Serve it over HTTP, never `file://`. Module scripts and `fetch` both fail on
   a file URL:
   ```bash
   npx serve dist -l 5055          # or: python -m http.server 5055 -d dist
   ```
3. `node tests/public-smoke.mjs` and `node tests/motion-gallery.mjs` do not need
   the server (they start their own). Only `render3d-gallery.mjs` does, via
   `TARGET`.
4. Read the exit code, not the log volume. Each gate keeps a `failures` counter
   and exits non-zero if it is non-zero (`public-smoke.mjs:143-144`,
   `render3d-gallery.mjs:253-254`, `motion-gallery.mjs` same pattern).

## 7. Interpreting a failure

| Symptom | First thing to check |
|---|---|
| `dist/index.html not found` | `npm run build` was skipped |
| every count is 0 | content fetch failed; open the page and read the console, then check `VITE_*` env or `dist/api/*.json` |
| modal assertions fail but the page looks fine | `renderRichDescription` grammar, then `shape.js` composition |
| gallery prints exist but are 0px | section was hidden at measure time; see `motion-gallery.ts:453-455` and the `maybeStart` fallback |
| rotation checks fail | `--mf-ar` / `--mf-rot-ratio` maths in `buildPrint` and the CSS block at `motion-gallery.css:289-309` |
| drag test advances but arrow after drag does not | something reintroduced `setPointerCapture` |
| `ERR_CONNECTION_REFUSED` in `render3d-gallery.mjs` | `TARGET` unset and nothing listening on 5055 |

## 8. What has no automated gate

- The loader sequence (quote, auto-dismiss, `#app-content` reveal). Verified by
  eye; the motion gate works around it by clicking through
  (`tests/motion-gallery.mjs:166-176`).
- Theme switching beyond the default. Only the default path is exercised.
- The lightbox focus trap and `Escape` handling.
- Custom domain and CDN behaviour. See `docs/BUILD-AND-DEPLOY.md` section 5.

A change to one of those requires adding the assertion in the same change. The
harness already exposes what is needed: `window.MotionFrames`, `window.RenderFrames`,
`window.openWorkModal`, `window.openWorkLightbox`.