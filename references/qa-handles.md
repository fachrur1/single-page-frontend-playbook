# QA handles

Two globals exist purely so a browser test can drive the page. They are shipped
in production and inert unless called, which is a deliberate trade: the same code
path the tests use is the one users get.

## 1. Shape of the handle

Each gallery section registers one handle during boot
(`motion-gallery.ts:1533-1550`):

| Global | Section |
|---|---|
| `window.MotionFrames` | `#motion` |
| `window.RenderFrames` | `#render-3d` |

```ts
interface GalleryHandle {
  gallery: MotionGallery;                 // the class instance, for .views
  setData(rows: Record<string, unknown>[] | MotionItem[]): void;
  inspect(): Record<string, unknown>;
  goTo(i: number): void;
  next(): void;
  prev(): void;
}
```

`setData` maps raw rows through the section's own mapper, unless the object
already looks like a `MotionItem` (it has `mediaType` and `videoUrl`), in which
case it is passed through (`motion-gallery.ts:1535-1543`). So a test can send
database-shaped fixtures or finished items; both work.

`setData` is a full remount: it clears the track and the tick row, removes the
skeleton, sets `data-mf-state="ready"` and measures again
(`motion-gallery.ts:444-487`). Anything you asserted before calling it is gone.

## 2. `inspect()` fields

Read-only snapshot (`motion-gallery.ts:1468-1508`).

| Field | Type | Meaning |
|---|---|---|
| `count` | number | number of prints |
| `active` | number | index of the active print |
| `loop` | boolean | ring mode (`count >= 3`) |
| `progress` | number | spring value, fractional between prints |
| `step` | number | horizontal distance between neighbouring prints |
| `lineTop` | number | y of the line at the pins |
| `sag` | number | centre sag of the line |
| `stage.width`, `stage.height` | number | measured stage size |
| `counter` | string | rendered counter text, e.g. `03 / 06` |
| `prints[]` | array | one entry per print, see below |

`prints[]` entries:

| Field | Meaning |
|---|---|
| `index` | print index |
| `title`, `project`, `mediaType` | item identity |
| `ratio` | layout ratio (already swapped for 90/270 turns) |
| `width`, `height` | `offsetWidth` / `offsetHeight`, transform independent |
| `mediaWidth`, `mediaHeight` | media box layout size |
| `rot` | current rotation in degrees, including breeze and swing |
| `rect` | `getBoundingClientRect()`, i.e. after transform |
| `mediaRect` | computed width and height of the media box |
| `hasVideo`, `hasFrame` | whether a `<video>` or `<iframe>` exists |
| `playing` | video exists, is not paused and has not ended |
| `visible` | `style.visibility !== 'hidden'` |

Three rules when asserting:

1. **Layout in `width`/`height`, hit testing in `rect`.** `rect` includes the
   rotation and the breeze offset, so it changes frame to frame.
2. **Settle before measuring.** Springs are still moving for a few hundred
   milliseconds after `goTo`, and the breeze never stops. Wait for
   `progress` to be within a small epsilon of an integer, or just sleep.
3. **`ratio` is the layout ratio.** For a 9:16 print rotated 90 degrees it is
   about 1.78, not 0.56. The source ratio is not exposed; compute it from
   `mediaWidth/mediaHeight` on an unrotated fixture if you need it.

## 3. Recipes

Wait for the handle, dismiss the loader, inject data, settle, read geometry:

```js
await page.waitForFunction(() => !!window.MotionFrames, { timeout: 25000 });
await page.evaluate(() => {
  const l = document.getElementById('loader');
  if (l) l.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
});
await page.evaluate((items) => window.MotionFrames.setData(items), items);
await page.waitForFunction(
  () => document.querySelector('[data-mf-stage]')?.classList.contains('is-live')
);
await new Promise((r) => setTimeout(r, 1500)); // entrance + poster decode
const g = await page.evaluate(() => window.MotionFrames.inspect());
```

Assert that the active print is centred, using the visual pivot rather than the
raw rect (the fixture is in `tests/motion-gallery.mjs:221-224`):

```js
const rad = (deg) => (deg * Math.PI) / 180;
const pivotX = (p) => p.rect.left + p.rect.width / 2 + (p.height * Math.sin(rad(p.rot))) / 2;
// expect pivotX(print) ~= stage.left + stage.width / 2
```

Force an empty section (hermetic, no content dependency, from
`tests/motion-gallery.mjs:631-651`):

```js
await page.setRequestInterception(true);
page.on('request', (req) => {
  if (/\/rest\/v1\//.test(req.url())) {
    req.respond({
      status: 200,
      contentType: 'application/json',
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': '*',
        'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
        'content-range': '0-0/0'
      },
      body: req.method() === 'OPTIONS' ? '' : '[]'
    }).catch(() => {});
    return;
  }
  req.continue().catch(() => {});
});
```

The CORS and `content-range` headers matter: the page's REST reads are plain
`fetch` with an `apikey` header, so a bare `[]` response without permissive
headers fails the request instead of returning an empty set.

## 4. Other globals worth driving

| Global | Use in a test |
|---|---|
| `window.openWorkModal(i)` | open a work modal without clicking a slide |
| `window.closeModal(id)` | close it deterministically |
| `window.openWorkLightbox(images, index, trigger)` | exercise the lightbox directly |
| `window.setTheme(name)` | switch theme, assert token changes |
| `window.goToWorkSlide(i)` | works carousel without arrow clicks |
| `window.__workMediaSets` | inspect the resolved URL set of a modal strip |

## 5. What the handles cannot tell you

- Whether a poster actually decoded. `hasVideo` and `mediaWidth` say nothing
  about image loading; check `img.complete && img.naturalWidth > 0` on the active
  print instead (`tests/render3d-gallery.mjs:96-120`).
- Whether a click was swallowed. For that, click with the mouse and read the
  counter (`tests/render3d-gallery.mjs:217-247`).
- Anything about sections outside the gallery. Those are asserted through the
  `#cms-*` containers and `.stat-counter` values instead.