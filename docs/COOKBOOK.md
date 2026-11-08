# Cookbook

Twelve changes the site actually gets asked for: the goal, the files and line
ranges, the order, one command that proves it worked, and what breaks when a
step is skipped. Line numbers are a snapshot; grep the identifier printed next
to each range if it drifts. Risk here means silence: **low** fails in plain
sight, **medium** fails quietly or on one viewport, **high** can ship a broken
write path with a clean console.

---

## 1. Add a work card, no code

**Goal.** One more Works slide with its own modal, no source change. Risk: low.

**Files.** `admin/src/schemas.js:63-107` (fields), `src/cms/shape.js:315-343` (row to card), `index.html:2003-2044` (card), `2048-2055` (dots, counter).

**Steps**

1. Admin, Projects, New: `title`, `slug`, `short_description`.
2. Write `full_description` with standalone meta lines (`Role:`, `Organization:`, `Duration:`, `Location:`, `Focus:`, `Tools:`) and block headers (`Problem:`, `Approach / Process:`, `Action:`, `Outcome:`, `Key Learnings:`). Parsed at `index.html:1622-1639`.
3. Pick a category (card eyebrow, `shape.js:334`; empty renders as `Project`) and add technologies (`index.html:2030`).
4. Add a cover. It becomes image key `wm{i}` (`shape.js:317-319`).
5. Keep *Include in works* checked; unchecked rows are skipped (`shape.js:316`).
6. Set `sort_order`. Order is sort, then `display_priority` descending, then `created_at` (`shape.js:375-379`).
7. Publish. Drafts are filtered before the shape exists (`shape.js:265-267`).

**Verify.** The gate asserts at least 12 slides and a counter that matches:

```bash
npm run build && node tests/public-smoke.mjs
```

**Skip it and** the card is visible in the admin and invisible to the page. A
draft row reads as "the renderer is broken" until the status column is checked.

---

## 2. Add or move a section with its paint block

**Goal.** A new `<section id="...">` the renderer fills, linked so anchors and the active link observer still work. Moving one is the reverse. Risk: medium.

**Files.** `index.html:1127-1134` (template), `2157-2169` (paint block), `958-962` and `1017-1021` (both navs), `2258-2261` (scramble), `2280-2283` (stagger), `1212` (insert point).

**Steps**

1. Copy the photography shape: `reveal` section, id, heading wrapper, one empty grid container id ending in `-container`.
2. Insert before organizations (`index.html:1212`).
3. Add a paint block after `2169` with the same guard: read the container, bail if element or data is missing, `esc()` every interpolation (`1553`).
4. Add the heading id to `2258` and the container id to `2280`.
5. Add the nav link in both menus, in section order.
6. Moving a section: move markup, reorder both navs, keep `#motion` right after `#photography` (`tests/motion-gallery.mjs:616-620`).

**Verify.**

```bash
grep -c 'cms-awards-container' index.html   # 2: markup plus paint
npm run build && node tests/public-smoke.mjs
```

**Skip it and** a heading appears over an empty grid with no console error: the
guard is `if (container && data)`, so a typo silently no-ops. Move a section
without `scroll-margin-top` and the target hides under the 80px header; only
`.mf-section` has it today (`src/gallery/motion-gallery.css:38`).

---

## 3. Add a field to the work modal metadata grid

**Goal.** A line such as `Partners: PT Example` lifted into the metadata grid. It needs three key lists, not one. Risk: medium.

**Files.** `index.html:1622` (`META_KEYS`, does it parse), `1713` (`META_ORDER`, where it sorts), `1717-1722` (column logic), `src/cms/shape.js:28-30` (`LEGACY_META_KEYS`).

**Steps**

1. Add the lowercase key to `META_KEYS`. The parser takes 2 to 25 characters of letters, spaces, `&`, `/`, `-` before the colon (`1625-1628`).
2. Add it to `META_ORDER` at the intended position; missing keys sort last (`1714`).
3. Add the display spelling (`Partners`) to `LEGACY_META_KEYS`.
4. Only for a database column: add the pair to `metaPairs` (`shape.js:198-205` projects, `225-230` experiences). Text that already carries the line is never duplicated (`shape.js:178-188`).

**Verify.**

```bash
grep -in 'partners' index.html src/cms/shape.js   # three hits
node --test tests/shape.test.mjs                  # 18 pass
```

**Skip it and** two quiet failures appear. `META_KEYS` only: the line parses and
sorts last, which reads as broken ordering. `META_ORDER` only: the line is
rejected and falls back into the body as a stray paragraph. Neither throws. One
field can also reflow the grid, since columns are three or two by count (`1719`).

---

## 4. Change the hero copy

**Goal.** New name, subtitle or typewriter line, in the layer that is actually live. Risk: medium.

**Files.** `index.html:1051-1052` (markup), `1903-1932` (paint), `content/data.json` `hero` (static), `src/cms/shape.js:433-438` (live fields).

**Steps**

1. Decide the live layer. `npm run build` inlines `VITE_*`; with Supabase set, the `profiles` row wins and JSON edits do nothing.
2. Live: edit `hero_line1`, `hero_line2`, `professional_headline`, `short_intro` (`shape.js:433-438`).
3. Static: edit `hero` in `content/data.json`, never `public/api/data.json`, which is regenerated from it (`scripts/build-cms.ts:20-25`).
4. Match the markup too to avoid a flash of old copy (`index.html:1051-1052`). The title is replaced via `innerHTML` (`1904`), the description escaped then retyped (`1911-1925`).

**Verify.**

```bash
node -e "const d=require('./public/api/data.json');console.log(d.hero.title_line1)"
npm run dev   # hard reload, typewriter must finish
```

**Skip it and** the markup edit vanishes when data arrives. The paint block
rewrites the `h1` whenever `textData.hero` exists, which is always, in both live
and fallback mode.

---

## 5. Add a theme

**Goal.** A ninth switcher entry that applies on desktop and mobile, including the gallery plate. Four edits, no JavaScript. Risk: low.

**Files.** `index.html:188-209` (token block), `2312-2321` (`FELTS`), `974-998` (desktop), `1025-1032` (mobile), `2301-2329` (handler).

**Steps**

1. Add a `[data-theme="ember"]` block with all 19 declarations including `--primary-rgb`. The name set is fixed; the Tailwind aliases and both canvases expect it.
2. Add `ember: ['#..', '#..', '#..']` to `FELTS`, light to deep. It drives `--tt-felt-*`, the gallery plate.
3. Add a menu row with `data-set-theme="ember"` to the desktop dropdown.
4. Add a swatch with the same attribute to the mobile menu. The click handler is delegated over `.theme-btn` (`2335-2346`), so nothing else changes.
5. Keep the block in the style block being edited: five themes in `#theme-vars` (`181-305`), three in the second block (`541-605`). Either home works; splitting one theme across both does not.

**Verify.**

```bash
grep -c 'data-theme="ember"' index.html       # 1
grep -c 'data-set-theme="ember"' index.html   # 2
```

Switch in both menus, reload, confirm persistence (`2332`) and a new plate hue.

**Skip it and** nothing errors. No `--primary-rgb` means every
`rgba(var(--primary-rgb), ...)` glow and both canvases render black. No `FELTS`
row means monochrome grey felt (`2322`). No mobile button means the theme is
unreachable on a phone, which a desktop test never shows.

---

## 6. Add a gallery item with a rotated portrait clip

**Goal.** A vertical clip that reads as a landscape print: the frame reserves landscape space, the media turns inside it. Risk: medium.

**Files.** `src/gallery/motion-gallery.ts:168-193` (mapper), `196-199` (allowed rotations), `701-708` (layout swap), `motion-gallery.css:289-309` (rules), `admin/src/schemas.js:387-388` (fields).

**Steps**

1. Set `aspect_ratio` to the clip's real shape, `9:16`. Source ratio, not screen shape.
2. Set `rotation` to `90`. Only 0, 90, 180, 270 survive the mapper.
3. Set `media_type`, `video_provider`, `video_url`, `poster_url`. The item is dropped when video, image and poster are all empty (`342`).
4. Set `display_order`, publish. The query filters `is_published`, orders by `display_order` then `created_at` (`336`).
5. Static path: add the object to `content/motion.json` and rebuild, which copies it to `api/motion.json` (`scripts/build-cms.ts:122-130`).

**Verify.**

```bash
npm run build && npx serve dist -l 5055
TARGET=http://localhost:5055/ node tests/render3d-gallery.mjs
```

The rotation group injects 9:16 at 0, 90, 180 and 270 and reads back layout
ratio, transform and fill (`tests/render3d-gallery.mjs:146-188`).

**Skip it and** the bug looks like CSS. `rotation: 90` without `aspect_ratio`
defaults the ratio to 16:9 (`701`), so the box becomes 9:16 and the output is
a narrow portrait print holding a sideways landscape clip.

---

## 7. Change the gallery print size

**Goal.** Bigger or smaller prints on both clotheslines without breaking drag or the viewport cap. Risk: high.

**Files.** `src/gallery/motion-gallery.css:20-23` (scoped vars), `191-197` (pre-mount width), `src/gallery/motion-gallery.ts:779-783` (`cssNum`), `797-801` (budget), `805` (`maxInnerW`), `811-815` (`step`), `850-854` (`targetWidth`).

**Steps**

1. Prefer the CSS custom properties. They are read through `cssNum()`, so the class follows them with no TypeScript change.
2. To grow prints, raise `maxInnerW` (`0.46` of stage) before the vertical budget; height binds first.
3. Raising the budget requires raising the `step` clamp too. `step` maps drag pixels to index (`1245`), so prints that grow while it stays put double the drag speed.
4. Do not pin a pixel width on `.mf-print`: the 300px is pre-mount and overwritten inline (`191-197`).

**Verify.**

```bash
npm run build && node tests/motion-gallery.mjs
```

It asserts portrait narrower than landscape, 21:9 shorter than 16:9, the viewport
cap, and no stage overflow.

**Skip it and** one of three invisible contracts breaks: neighbours overlap
because `step` did not grow, tall prints clip because height is clamped to
`budget` (`823-827`), or the active print stops centring because `step` and
`targetWidth()` disagree.

---

## 8. Add a static fallback field

**Goal.** A new top level text field the page reads when Supabase is not configured, with no database change. Risk: medium.

**Files.** `content/data.json` (source), `scripts/build-cms.ts:20-25` (whole-file copy), `122-130` (separate JSON), `index.html:1793-1801` (read point).

**Steps**

1. Add the key to `content/data.json` next to `hero`, `about`, `contact`.
2. Read it after the bundle resolves with the photography guard (`1800-1807`): check element, check value is not null, assign with `textContent`.
3. Give the markup a default so first paint is not empty (`1127-1134`).
4. Rebuild. The builder copies `content/data.json` to `public/api/data.json`; Vite copies `public/` to `dist/`.
5. Never hand-edit `public/api/data.json`. It is generated.

**Verify.**

```bash
npm run build
node -e "console.log(require('./dist/api/data.json').photography_eyebrow)"
```

**Skip it and** the field exists in source and never reaches the browser. Two
usual causes: editing `public/api/data.json` (overwritten on next dev start) or
adding the key to `content/core/site.json`, which is ignored while the monolith
exists (`build-cms.ts:20-26`).

---

## 9. Wire a new category kind

**Goal.** A new `content_categories.kind` value, for example `certification`, grouping rows the way `skill_group` groups skills. The database is the first gate. Risk: high.

**Files.** `supabase/migrations/0001_schema.sql:72` (check constraint), `supabase/SETUP_ALL_IN_ONE.sql:80` (fresh installs), `src/cms/shape.js:383-385` (consumer), `395-411` (output), `tests/shape.test.mjs` (spec).

**Steps**

1. Write a migration that drops and re-adds the constraint with the new value. Do not edit `0001_schema.sql` in place; it is applied on live.
2. Update `SETUP_ALL_IN_ONE.sql:80` to match, or the next fresh environment rejects a row production accepts.
3. Read the kind in `buildContentShape()`. Copy the `skill_group` branch, which filters by kind and joins on `category_id`, and emit a new array.
4. Add markup and a paint block (recipe 2).
5. Add a case to `tests/shape.test.mjs`.

**Verify.**

```bash
node --test tests/shape.test.mjs
```

Then create one category with the new kind in the admin. A violation returns 400
`new row violates check constraint`, shown as a generic save error.

**Skip it and** either the write fails while the code looks right, or the code
ships and nothing renders because the builder ignores unknown kinds. Both are
silent on the public page.

---

## 10. Add a third gallery source

**Goal.** Another clothesline section fed by its own table, same class as `#motion` and `#render-3d`. Risk: medium.

**Files.** `src/gallery/motion-gallery.ts:311` (union), `313-328` (`SOURCE_CONFIG`), `1524-1531` (dispatch), `1549-1550` (handles), `index.html:1176-1210` (markup), `scripts/build-cms.ts:122` (fallback copy).

**Steps**

1. Add one `SOURCE_CONFIG` entry: `table`, `headingKey`, `descriptionKey`, `fallback`, `map`. `normalizeRender` for stills, `normalize` for video.
2. Extend the `GallerySource` union at `311`.
3. Copy the `#render-3d` block: new id, eyebrow, headings, `data-mf-source`. Keep every `data-mf-*`; the constructor queries them by name.
4. Extend the two-way ternary at `1525` and give the source a `window.*Frames` handle at `1549-1550`.
5. Add the fallback file to the copy list at `build-cms.ts:122`.
6. Create the table and the two `site_settings` keys.

**Verify.**

```bash
npm run build && npx serve dist -l 5055
# console: window.ProcessFrames.inspect()
```

With an empty table the section must stay hidden, not show a bare clothesline.

**Skip it and** the section is invisible with no error: a missing JSON returns
`{items: []}` (`350-365`) and `bootSection` sets `data-mf-state="empty"`
(`1555-1558`). Forgetting the copy list looks exactly like a CSS bug.

---

## 11. Make a section hide itself when empty

**Goal.** No heading over an empty grid. The gallery already does this; the data sections do not. Risk: low.

**Files.** `src/gallery/motion-gallery.css:33` (existing rule), `src/gallery/motion-gallery.ts:1555-1558` (how the state is set), `index.html:2157-2169` (paint block), `1127` (markup).

**Steps**

1. Add `section[data-empty="true"] { display: none; }` next to the gallery's empty rule.
2. After filling the container, set the flag from the children count.
3. Get the section with `container.closest('section')`, not a hardcoded id, so a move cannot break it.
4. Repeat for education, skills, photography, organizations. Works already hides arrows and dots.

**Verify.**

```bash
cp content/data.json content/data.json.bak
node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync('content/data.json'));d.photography=[];fs.writeFileSync('content/data.json',JSON.stringify(d,null,2))"
npm run dev    # Photography must be gone, no empty grid
mv content/data.json.bak content/data.json && npm run dev
```

That rewrites `content/data.json`, so keep both copy lines.

**Skip it and** the page grows a heading with dead space under it, which reads as
a layout bug rather than a content state. `hidden` alone loses to a display
utility on the same element; the attribute selector wins.

---

## 12. Change the CV button target

**Goal.** Every Download CV control points at the new file and stays there after the CMS loads. Risk: high.

**Files.** `index.html:965` (nav), `1037` (mobile menu), `1054` (hero), `src/cms/public-content.ts:110-122` (override), `80` (active document), `tests/public-smoke.mjs:117-118`.

**Steps**

1. Decide who owns the link. With Supabase set, the active `documents` row wins: `applyCvLinks()` rewrites every anchor that has `download` and whose `href` ends in `.pdf` (`115-121`).
2. Live: upload the PDF in admin Documents and mark it active (`documents?is_active=eq.true`, `80`).
3. Static: replace the CV file at the repo root and keep the name, or change all three anchors. Three buttons, one target.
4. Do not put `download` on an unrelated PDF link; the override will rewrite it too.

**Verify.**

```bash
grep -n 'CV_[A-Za-z_]*\.pdf' index.html   # 3 hits
npm run build && node tests/public-smoke.mjs
```

The gate asserts a `[download]` anchor points at a PDF, so also read the
rendered `href` in the browser.

**Skip it and** the result is a split brain: one button on the new file and
two on the old, or all three correct in source and all three overridden at
runtime. The override runs after first paint, so View Source looks fine.