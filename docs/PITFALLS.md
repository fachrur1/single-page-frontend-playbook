# Pitfalls

Numbered, in rough order of how often they bite. Each entry is: what breaks, why,
and what to do instead.

## 1. Native image drag eats the carousel gesture

**Symptom:** dragging a print starts a translucent "file" ghost, or the pointer
lifts a frozen copy of the image, and the carousel does not move. Worse on
Windows. Select-all and text selection also behave oddly around prints.

**Why:** an `<img>` is draggable by default. The browser starts a drag-and-drop
operation and stops delivering `pointermove` to the stage.

**Do:** keep all three defences. `draggable="false"` on the element
(`motion-gallery.ts:606-609`), `-webkit-user-drag: none` plus `user-select: none`
on prints, images and videos (`motion-gallery.css:203-218`), and a
`dragstart` handler that calls `preventDefault()` on the stage
(`motion-gallery.ts:1171-1174`). The browser gate asserts the attribute
(`tests/render3d-gallery.mjs:193-207`), not the CSS, so removing either one still
passes locally.

## 2. `setPointerCapture` swallows the next click

**Symptom:** the play and fullscreen buttons inside prints never fire, or fire
only on the second tap.

**Why:** pointer capture retargets the compatibility `click` event to the
capturing element, so the button never sees it.

**Do:** bind `pointermove`, `pointerup` and `pointercancel` on `window` and keep
the gesture id in a local drag object (`motion-gallery.ts:1205-1210`,
`1233-1294`). The source comment at `:1205-1207` records the reason. The
regression is covered by "arrow still works right after a drag"
(`tests/render3d-gallery.mjs:243-247`).

## 3. Anchor jumps land under the fixed header

**Symptom:** clicking a nav link scrolls a section under the top bar, hiding its
heading, or dropping the reader straight past the gallery's prev/next buttons.

**Why:** the header is `fixed` (`index.html:951`, `1006`) and `<main>` reserves
80px with padding (`index.html:1040`). Anchor targets know nothing about that
overlay, and the smooth scroll handler calls `scrollIntoView` with no offset
(`index.html:2505`).

**Do:** give every anchor target `scroll-margin-top` at least as large as the
header. Only `.mf-section` has it today (`motion-gallery.css:38`), which is why
the galleries behave and the other sections do not. If you touch the header
height, update that value and add the same rule to `section[id]`.

## 4. An `IntersectionObserver` alone is not enough for an entrance

**Symptom:** a gallery (or a card grid) stays invisible until the user scrolls
away and back, or stays blank forever on a short page or after an anchor jump.

**Why:** the section is `display:none` at boot (it has no content yet), so the
observer reports "not intersecting" and never fires again if the element becomes
visible while already in view.

**Do:** keep the observer for the ongoing gate, and add a one-shot fallback: a
`requestAnimationFrame` check plus a scroll listener that both call a plain
rectangle test (`motion-gallery.ts:508-516`, `573-578`). The observer then only
maintains `onScreen` for the breeze (`:492-502`).

## 5. A rotated element reports a rotated rectangle

**Symptom:** geometry assertions fail by a few pixels, or a hit test misses the
print that is visibly under the cursor.

**Why:** `getBoundingClientRect()` returns the axis-aligned box **after**
transforms, so a print with a rotation of 2.2 degrees reports a wider and taller
box than its layout size.

**Do:** assert layout with `offsetWidth` / `offsetHeight` and assert hit testing
with the live rect, and label which is which. `inspect()` exposes both for that
reason (`motion-gallery.ts:1489-1500`). Tests that need the visual centre
compensate for the rotation explicitly (`tests/motion-gallery.mjs:221-224`).

## 6. The paper's chrome is not part of the media's aspect ratio

**Symptom:** prints are 22px too small, or a print's media overflows its paper by
exactly the border width.

**Why:** the aspect ratio lives on `.mf-media` (`motion-gallery.css:249`) while
the animated width belongs to the print element, which also has 10px of padding
on each side and a 1px border.

**Do:** convert media width to print width with `CHROME = PAD * 2 + 2`
(`motion-gallery.ts:95-97`, `850-854`). Keep `PAD` in sync with `--mf-pad`
(`motion-gallery.css:20`); a mismatch is invisible until you measure.

## 7. Content assertions rot

**Symptom:** a browser gate passes today and fails next month with no code
change, because the owner edited content.

**Why:** the test hardcodes a project title, a total, or a name that lives in the
database.

**Do:** assert self-consistency instead. The works gate compares the counter to
the number of rendered slides rather than to a literal
(`tests/public-smoke.mjs:93-96`), and the modal is checked against the title of
the first slide it just read (`:104-111`). When a total really must be pinned,
stub the data instead of trusting production
(`tests/motion-gallery.mjs:626-657` returns `[]` for every REST call).

## 8. Tailwind CDN cannot load plugins, so `prose` is a no-op

**Symptom:** markdown renders at body size with no list markers and no heading
hierarchy. Adding `prose prose-invert` changes nothing.

**Why:** `cdn.tailwindcss.com` accepts only an inline config object
(`index.html:24`, `102-179`) and cannot register `@tailwindcss/typography`. The
root `tailwind.config.js` that does register it is not used by this page.

**Do:** style markdown in `.md-body` (`index.html:651-771`) and give the surface
the class. `prose-*` in this page means nothing.

## 9. Undefined token family: `--md-sys-color-*`

**Symptom:** a work card's fallback pattern is missing, or a scrollbar is
uncoloured, and no error appears anywhere.

**Why:** `var(--md-sys-color-surface-container-highest)` and friends are used ten
times (`index.html:185`, `1990-1996`, `2100-2106`) but never defined. The tokens
are named `--color-*` (`index.html:188-301`). An invalid `var()` makes the whole
declaration invalid at computed-value time, so it silently disappears.

**Do:** use `--color-*`. When adding a token, grep for both spellings before
assuming the theme is broken.

## 10. A class toggle with no CSS is a dead feature

**Symptom:** the navbar never hides on scroll, the active nav link never looks
active, and the back-to-top button never hides at the top of the page.

**Why:** `nav-hidden` (`index.html:2468-2472`), `active-link`
(`index.html:2486-2489`) and the FAB's `visible` class
(`index.html:2525-2529`) are toggled by JavaScript and defined in no stylesheet.
`visible` only collides with an unrelated Tailwind utility.

**Do:** before wiring a class toggle, confirm a rule exists for that exact
class. Add the rules (or delete the code) in the same change; a toggle that
compiles and runs but changes nothing is the hardest kind of bug to notice.

## 11. `content/data.json` silently overrides the modular content

**Symptom:** you edit `content/core/*.json` and nothing changes in the build.

**Why:** if `content/data.json` exists, `build-cms.ts` copies it verbatim and
skips the modular path entirely (`scripts/build-cms.ts:20-26`).

**Do:** check which mode is active before debugging the renderer:
`ls content/data.json`. Either delete the monolithic file or edit it, but do not
edit both.

## 12. Duplicate meta lines in a work modal

**Symptom:** the metadata grid shows the same field twice, or shows a value the
author did not write.

**Why:** structured columns are merged into the description text and then parsed
back out in the browser. Merging into a description that already contains meta
lines duplicates them.

**Do:** rely on the three guards: skip merging when the description is
self-describing (`shape.js:126-136`), never add a key that exists anywhere in the
text (`ensureMetaBlock`, `shape.js:178-188`), and de-duplicate again in the
renderer (`index.html:1704-1710`). If you add a meta key, add it to
`LEGACY_META_KEYS` (`shape.js:28-30`), `META_KEYS` (`index.html:1622`) and
`META_ORDER` (`index.html:1713`).

## 13. `[object Object]` in tags and captions

**Symptom:** a technology chip or a filter label reads `[object Object]`.

**Why:** older admin builds wrote tag fields as `[{url, caption, alt}]` objects.
String interpolation of an object produces that literal.

**Do:** normalise through `arr()` and `labelOf()` (`shape.js:42-62`) or
`stringList()` and `tagLabel()` (`motion-gallery.ts:148-165`). Never interpolate a
CMS field that might be an array without passing it through one of them.

## 14. One thrown error blanks every section after it

**Symptom:** the page renders the hero and about, then nothing.

**Why:** all paint blocks run inside one `try` (`index.html:1793-2287`). The
first exception jumps to the catch, which only logs (`:2285-2287`).

**Do:** when a section after another one is empty, look at the console for the
first error, not at the empty section. Assume the cause is upstream. When adding
a paint block, keep it defensive: guard on the container existing
(`if (container && textData.x)`).

## 15. `textData.settings` does not exist

**Symptom:** changing the site's text alignment has no effect on the work modal.

**Why:** the modal reads `textData.settings?.text_alignment`
(`index.html:2092`), but the shape deliberately ships no `settings` object
(`shape.js:473-474`), so the fallback always applies.

**Do:** read alignment from `settingsData.text_alignment`, which is where it
actually lives (`shape.js:480`), and apply it where needed. `#cms-about-body`
already does (`index.html:1938`).

## 16. The lightbox and the modal fight over `body.overflow`

**Symptom:** after closing a fullscreen image inside a work modal, the page
cannot scroll, or the modal closes with it.

**Why:** both features lock scrolling. The lightbox saves and restores the
previous value (`index.html:2769`, `2783`); `closeModal` restores an empty string
after a 300ms delay (`index.html:2661-2665`).

**Do:** always save the previous inline value and restore that, never assume the
body should scroll afterwards. Keep the lightbox above the modal with
`.wl-overlay` at `z-index: 1200` versus the modal's `z-[100]`
(`index.html:813`, `2117`), and stop propagation on the overlay's own clicks
(`index.html:2717`).

## 17. The loader and the hero typewriter race

**Symptom:** the hero description is empty, or the caret blinks with no text.

**Why:** the animation is defined by the renderer but started by the loader
(`index.html:1913`, `1492`). Either can finish first.

**Do:** keep both paths. The renderer starts the animation itself when the loader
is already gone (`index.html:1927-1930`), and the loader calls the global if it
exists. Do not move the call into a single `DOMContentLoaded` handler.

## 18. Measuring a section that is still hidden

**Symptom:** prints are 0px wide, the stage has no height, or the SVG line has a
degenerate path.

**Why:** `.mf-section[data-mf-state="empty"]` is `display:none`
(`motion-gallery.css:33`). Any measurement taken before the state flips is zero.

**Do:** set `data-mf-state` before measuring (`motion-gallery.ts:453-455`), read
`clientWidth` with a viewport-based fallback (`:786`), and drive re-measurement
from a `ResizeObserver` (`:518-523`).

## 19. Video decoders accumulate

**Symptom:** after browsing several prints, later videos refuse to play, stay
black, or the tab becomes sluggish.

**Why:** browsers cap the number of simultaneous media decoders, and each
`<video>` element holds one.

**Do:** keep `pruneVideos()` (`motion-gallery.ts:1437-1443`) and destroy both
videos and iframes beyond two prints from the active one, and pause everything
before starting a new one (`pauseAll`, `:1407-1413`). The gate asserts that only
one video exists and that distant ones are released (`tests/motion-gallery.mjs:517-550`).

## 20. Cache-busted JSON, or stale content for an hour

**Symptom:** a content change does not appear even though the JSON on the server
is correct.

**Why:** the static fallback files are served with whatever the CDN's default
cache policy is, and the page itself arrives through the CDN.

**Do:** keep the `?v=${Date.now()}` query on the fallback fetches
(`index.html:1780-1782`, `motion-gallery.ts:351`). There is no `_headers` file in
`public/`, so no explicit cache policy is configured; do not "optimise" those
query strings away without adding one.

## 21. `cursor: none` on every element

**Symptom:** in the gallery, the grab cursor never appears; in the rest of the
page, the native cursor is invisible and only the custom dot shows.

**Why:** `@media (pointer: fine) { * { cursor: none !important } }`
(`index.html:468-472`) beats any component-level cursor rule, including
`.mf-stage { cursor: grab }` (`motion-gallery.css:150`).

**Do:** treat the custom cursor as the only cursor on fine pointers, and give the
gallery feedback with its own label (`Drag` / `Play`, `motion-gallery.ts:1214-1229`)
rather than relying on a cursor image.

## 22. Dynamic class names must be literals

**Symptom:** a card painted by the renderer has no colour, while the same classes
work in static markup.

**Why:** the CDN build generates utilities from class strings present in the
document; `'text-' + tone` never produces a rule.

**Do:** keep whole class strings in tables, as `BLOCK_CARDS` does
(`index.html:1633-1639`), and interpolate the finished string.