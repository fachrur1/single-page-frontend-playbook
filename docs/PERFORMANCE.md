# Performance

What the public page costs, measured. Numbers come from the demo build of this source at
`C:/Users/fahru/AppData/Local/hermes/cache/scratch/demo-site`, read on 2026-11-09 with the commands in
section 1. Anything marked **measured** was read off a file, a header, or a `grep` count. Anything marked
**modelled** follows from the code and is labelled as such. There is no browser trace, no Lighthouse run,
no throttle profile behind this document, and none is implied.

Short version: 195 KB of HTML, 4.01 MB of icon font, 574 KB of JavaScript across three scripts, and the
first painted content held behind a 2.9 s timer chain.

## 1. Reproduce

```bash
# raw and gzip -9 for every file in a build (single line, node zlib)
node -e "const z=require('zlib'),fs=require('fs');const w=d=>{for(const e of fs.readdirSync(d)){const p=d+'/'+e;if(fs.statSync(p).isDirectory())w(p);else{const b=fs.readFileSync(p);console.log(String(b.length).padStart(8),String(z.gzipSync(b,{level:9}).length).padStart(7),p)}}};w(process.argv[1])" dist

gzip -c dist/index.html | wc -c                                    # one file, system gzip
curl -sS -o tw.js -w '%{size_download}\n' https://cdn.tailwindcss.com/3.4.17
curl -sS --compressed -o /dev/null -w '%{size_download}\n' https://cdn.tailwindcss.com/3.4.17
curl -sSI https://fonts.gstatic.com/s/materialsymbolsoutlined/v383/kJEhBvYX7BgnkSrUwT8OhrdQw4oELdPIeeII9v6oFsI.woff2 | grep -i content-length
```

gzip implementations disagree by about 0.6 percent on this file: 46,104 bytes with node
`zlib.gzipSync({level:9})`, 46,051 with `gzip -c`, 45,838 with Python `gzip.compress(9)`. Every gzip
number below comes from the node command, so the table is internally consistent.

## 2. What the browser downloads

Measured file sizes. `n/a` means the body is not served gzipped (woff2, SVG) or the encoding is the
origin's choice and was not measured as gzip.

| File | raw | gzip -9 | Loads |
|---|---:|---:|---|
| `index.html` | 195,294 | 46,104 | document |
| `assets/main-*.js` | 35,163 | 11,934 | module script, after the document |
| `assets/main-*.css` | 11,316 | 3,061 | stylesheet, after the document |
| `assets/modulepreload-polyfill-*.js` | 698 | 392 | preload, after the document |
| `assets/favicon-*.svg` | 265 | 210 | browser chrome |
| `https://cdn.tailwindcss.com/3.4.17` | 407,279 | 126,354 * | before the body parses |
| Montserrat stylesheet | 3,828 | n/a | render blocking |
| Courier Prime stylesheet | 3,530 | n/a | render blocking |
| Material Symbols stylesheet | 631 | n/a | render blocking |
| Montserrat latin woff2, normal and italic | 37,956 / 39,632 | n/a | first Montserrat face; italic only if used |
| Courier Prime latin woff2, 4 faces | 21,556 / 18,640 / 21,980 / 19,348 | n/a | hero description only |
| **Material Symbols Outlined woff2** | **4,011,996** | n/a | first icon in the viewport |
| `api/data.json`, `api/images.json`, `api/settings.json` | 11,055 / 1,797 / 38 | 3,794 / 351 / n/a | fallback when Supabase is not configured |

\* measured with `curl --compressed`, which reports the transfer size the CDN chose (gzip or brotli). It is
not a `gzip -9` of the body.

The icon font is not a typo: the `Content-Length` header says 4,011,996 and the body starts with `wOF2`.
Nine glyph names are written in `index.html` (`arrow_upward`, `chevron_left`, `chevron_right`, `close`,
`download`, `fullscreen`, `mail`, `menu`, `palette`) and the CMS adds category icons on top
(`src/cms/shape.js:401`). Google serves one variable file for the whole symbol set with `FILL`, `GRAD`,
`opsz` and `wght` axes, and it is requested by the first icon that paints, which is the header.

Assets in the build that the public page never requests (measured by walking the demo tree; nothing in
the built HTML or JS references them by path): `admin-*.js` 463,729 bytes (124,320 gz) and `admin-*.css`
28,889 (6,401 gz) on `/admin/` only; `suitability-*.js` 25,392 (7,785 gz), `data/points.json` 50,354
(5,008 gz), `models/pltmh_kulon_progo.obj` 7,630,360 and `models/Terrain_DEM_tile_material.jpg`
3,499,077 on the suitability page only; `assets/images/*` 36,302,392 across 13 files (section 8). The
suitability page pulls `three`, `chart.js` and `lucide` from public CDNs through an import map, which is
why `three` is listed as external in `vite.config.ts:13-18`.

## 3. What ships in the document, what is deferred

Measured split of the built `dist/index.html` (193,042 UTF-8 bytes; 195,294 on disk because of CRLF):
inline `<script>` 131,202 bytes (68.0%), of which `marked` 15.0.12 is 39,939 and the Tailwind config is
5,144, leaving 86,119 for the renderer and page scripts; inline `<style>` 27,744 (14.4%), of which theme
variables are 5,352; markup and meta 34,096 (17.7%).

Nothing is extracted at build time. The inline renderer stays inline. The two module scripts become
`assets/main-*.js` (35,163 bytes, containing `src/cms/public-content.ts`, `src/cms/shape.js`,
`src/gallery/motion-gallery.ts` and `src/gallery/spring.ts`), and `motion-gallery.css` becomes
`assets/main-*.css` (11,316 bytes). `marked` is not in that bundle, it is the inline block at
`index.html:25-96`. So every page load parses 131,202 bytes of script before the parser reaches the body,
with no cache entry of its own.

Deferral is by route, not by code splitting: `admin/` and `suitability-land-for-RE/` are separate entries
(`vite.config.ts:19-24`) and their bundles load only on those URLs. Within the public page there is no
dynamic import at all.

## 4. The parser stops at line 24

Measured: 75,414 bytes, 39.1% of the document, sit before `</head>`. The first third-party tag is a
synchronous script at `index.html:24`: 407,279 bytes raw, 126,354 on the wire. It is the Tailwind Play
CDN, so it compiles utility classes in the browser after it loads. Its cost is download plus parse plus
CSS generation, and it cannot be cached by class usage; the page gives it 315 `class="` attributes to scan.

A classic script blocks the parser, so everything after line 24 waits: the `marked` block (`:25-96`), the
two preconnects (`:97-98`), the three font stylesheets (`:99-101`), the Tailwind config (`:102`),
27,744 bytes of inline CSS (`:181-914`) and the body. The preconnect to `fonts.gstatic.com` at `:98` is
placed correctly, but it sits behind the same block.

## 5. The loader holds the content for about 2.9 s

`#app-content` starts at `opacity-0 pointer-events-none` with a 1000 ms transition (`index.html:949`) and
is only revealed by `hideLoader()` (`index.html:1479-1494`), which is only called when the quote carousel
runs out. The timers:

| Step | line | delay |
|---|---|---:|
| first quote shown | `index.html:1536` | 100 ms |
| auto advance scheduled | `index.html:1510-1512` | 1,500 ms |
| fade out, then next quote | `index.html:1523-1527` | 800 ms |
| loader fade, content revealed | `index.html:1485-1493` | 500 ms |

That is **2,900 ms after `DOMContentLoaded`** before the page becomes visible, on a warm cache with a
perfect network. A click on the loader skips it (`index.html:1530-1534`), which is the only path that does
not pay the full wait. The reveal then runs a 1,000 ms opacity transition, so the visual settle is 3.9 s.
Both figures are **modelled** from the timer values, not observed in a browser. `loadContentBundle()` adds
a second gate before that: it polls for the module for up to 3,000 ms in 100 ms steps
(`index.html:1769-1771`) before falling back to `api/*.json`.

## 6. Animation loops

Two canvas loops re-arm a frame on every animation tick for the life of the tab, the hero one sized to the
viewport (`index.html:2835-2840`) and the particle one to its parent (`:1364-1367`). Both park their drawing
when off screen; neither cancels the callback. The gallery is the only loop with a full gate set.

| Loop | Where | Runs while | Stops when | Cost |
|---|---|---|---|---|
| Gallery springs and breeze | `motion-gallery.ts:983-1008` | stage on screen, tab visible, 2+ prints, reduced motion off (`:975-981`) | everything at rest (`:1007`) | one rAF, transforms only |
| Hero canvas | `index.html:2944-2982` | always scheduled | never, early return when `!heroVisible` (`:2946`) | 50 particles, 1,225 pair checks per frame |
| Particle canvas | `index.html:1384-1446` | always scheduled | never, early return at `:1385` | 50 particles, O(n^2) links when `hardwareConcurrency >= 4` (`:1352`) |
| Text scramble | `index.html:2209-2245` | until the queue completes | queue empty | `innerHTML` per frame per heading |
| Stats counter | `index.html:2544-2558` | fixed duration | progress reaches 1 | one rAF, `innerHTML` per frame |
| Theme poll | `index.html:2884` | forever | page unload | `setInterval` 2,000 ms, `getComputedStyle` on `documentElement` |

Gates that do exist: an `IntersectionObserver` at `threshold: 0.15` starts the gallery and keeps
`onScreen` current (`motion-gallery.ts:492-502`), with a rAF plus one scroll listener as fallback for a
stage that is already visible (`:508-516`); `visibilitychange` parks and restarts the breeze (`:527-532`,
re-checked in `breezeActive()`, `:975-981`); `prefers-reduced-motion` is read at module load (`:118`),
applied to the springs (`:470-473`), listened to at runtime (`:534-546`) and used to suppress the breeze
(`:980`); both canvases pause drawing through an observer (`index.html:1449-1452`, `:2863-2866`).

What is not gated: the canvas loops still schedule a frame while their section is off screen, so scrolling
the hero away leaves each loop re-arming a no-op on every tick. The hero canvas, the particle canvas, the
typewriter (`index.html:1913-1919`, a 100 ms `setTimeout` chain) and the scramble ignore
`prefers-reduced-motion`. Only the CSS at `index.html:909` and the gallery honour it. Two smaller costs,
both read from the code: the back-to-top ring reads `document.documentElement.scrollHeight` inside a
scroll handler (`index.html:2523`), forcing layout per scroll event, and the theme poll calls
`getComputedStyle` 30 times a minute while idle.

## 7. Cold load: 26 requests before the first image

Counted from the document and the fetch calls, not from a network panel. Order is the dependency order
the parser and the module graph impose; with HTTP/2 or HTTP/3 each group runs in parallel inside itself.

| # | Request | Transfer | Waits for |
|---|---|---:|---|
| 1 | `index.html` | 46,104 | nothing |
| 2 | `cdn.tailwindcss.com/3.4.17` | 126,354 | 1, parser blocking |
| 3-5 | 3 font stylesheets | 7,989 raw | 2, the parser was stopped |
| 6-9 | 4 font files, latin faces in use | 4,071,508 | 3-5 |
| 10 | `assets/main-*.css` | 3,061 | 2 |
| 11 | `modulepreload-polyfill` | 392 | 2 |
| 12 | `assets/main-*.js` | 11,934 | 2 |
| 13-25 | 13 PostgREST reads | depends on rows | 12 executes |
| 26 | `assets/favicon-*.svg` | 210 | browser, any time |

The 13 reads are `Promise.all` over `profiles`, `projects`, `project_media`, `experiences`, `education`,
`skills`, `organizations`, `gallery`, `content_categories`, `site_settings`, `social_links`, `documents`
and `site_images` (`src/cms/public-content.ts:68-82`). They are genuinely parallel: one connection,
multiplexed, no waterfall between them. Their weight depends on the published rows and was not measured
here, because the demo build runs the static fallback (6 files, 22,201 bytes total).

Without Supabase configured the count drops to 16, but the three JSON fetches carry `?v=Date.now()`
(`index.html:1780-1782`), so they miss the cache every time. `docs/PITFALLS.md` section 20 covers the
content-staleness trade; from a performance angle it means the fallback path can never be warm.

## 8. Images

`resolveImg()` (`index.html:1890`) returns the stored URL verbatim. There is no width, quality or format
parameter anywhere in `index.html`, so a 6,083,707 byte PNG ships as a 6,083,707 byte PNG. The single
`srcset` write (`index.html:1899`) copies one URL onto a `<source>`; it is not a candidate set.

Every raster is emitted twice over the same URL: a blurred, scaled backdrop plus a contained foreground,
at `index.html:1864-1865` (carousel slides), `:2130-2131` (work modal) and `:2162` (photography grid).
That is one request and two decodes at intrinsic size, both eager.

Lazy loading exists in two places: the work card cover (`index.html:2010`, the only `loading="lazy"` in
the document), and the gallery posters, hand-rolled: the first two prints get `src`, the rest get
`data-src` and are hydrated within two positions of the active print
(`src/gallery/motion-gallery.ts:601-623`, `:559-570`), with `decoding="async"` and `preload="metadata"`
for video (`:1355`).

Also measured: 12 `<img>` tags in the served HTML, 9 with `alt`, none with `width` or `height`, so nothing
the renderer injects reserves space. With the demo payload (12 work-gallery images, 6 photos) the doubling
produces 36 eager tags for 18 unique URLs, plus the 10 lazy covers; that count is **modelled** from the
templates and `api/images.json`. The demo assets themselves are cheap: 60 SVGs in `demo-img/` at 108,749
bytes total, 1.8 KB each, and `api/images.json` is 1,797 bytes. The 36.3 MB in `assets/images/` is a
different thing: no built HTML or JS references those paths, they are reachable only if a CMS image URL
points at `/assets/images/...`. They ship in `dist` regardless, 47 MB of deployment for a page that
downloads none of it.

## 9. Where the wins are

Ordered by measured weight. Gain is about bytes unless it says otherwise.

| Change | Evidence | Expected gain |
|---|---|---|
| Replace the Play CDN with a compiled stylesheet | 407,279 bytes of JS, 126,354 on the wire, parser blocked at `index.html:24` | removes a 126 KB render-blocking download and 407 KB of parse, plus runtime CSS generation; the largest serial step. Bytes measured, latency estimated |
| Stop shipping the full icon font | 4,011,996 bytes for 9 glyphs | inline those 9 SVGs, 2 to 3 KB; saves about 4.0 MB, 95% of all font bytes |
| Defer `marked` | 39,939 inline bytes, used only for modal descriptions (`index.html:1598-1599`) | 40 KB less parse before first paint, or a dynamic import on first modal open |
| Delete the loader timer chain | 100 + 1,500 + 800 + 500 ms at `index.html:1536`, `1510-1512`, `1523-1527`, `1485-1493` | about 2.9 s earlier first content; timers measured, latency estimated |
| One image per slot instead of two | `index.html:1864-1865`, `2130-2131`, `2162` | halves decodes and raster memory; a 6 MB source becomes one full-size decode |
| Request resized CMS images | no transform parameter in `index.html`, sources up to 6,083,707 bytes | at 800 px wide through Supabase transforms, an order of magnitude off the gallery payload; estimated, stored URLs are opaque |
| Stop re-arming rAF off screen | `index.html:1385`, `index.html:2945` | two no-op callbacks per animation frame removed while both canvases are out of view; small but continuous |
| Use the `themechange` event instead of polling | `index.html:2884`, event already dispatched at `index.html:2301-2328` | 30 `getComputedStyle` calls per idle minute removed |
| Prune unreferenced files from `dist` | `assets/images` 36.3 MB, `assets/models` 11.1 MB, `dist` 47 MB | nothing for visitors, 47 MB less per deploy and upload |
| Add cache headers | no `_headers` or `_redirects` file exists in the repo | control over `assets/*` immutability and `api/*` revalidation; today the Cloudflare Pages default applies |

Two things deliberately not on the list. Splitting the 35,163 byte bundle: it is already one file per
page and 11,934 gzipped, so there is nothing meaningful to split. Compressing the HTML harder: 195 KB to
46 KB is a 76.4% reduction and brotli would improve on it, but that number was not measured here.