# Accessibility

This describes what the page does today, from reading the source and the rendered
DOM. It is not an audit: no screen reader pass, no axe run, no testing with switch or
voice input. Every claim cites the line that makes it true, and every gap ends with
the smallest fix.

In short: the semantics are solid, the interactive shell is not. The work modal has
no dialog behaviour, the closed mobile menu stays in the tab order, the desktop
theme menu is unreachable by keyboard, and there is no skip link. The accent passes
AA in every theme except the sand one.

## 1. Landmarks and heading order

`lang="en"` and a real `<title>` (`index.html:1`, `4`), one `<nav>` (`951`), a
`<header>` for the mobile bar (`1006`), one `<main>` (`1040`), a `<footer>` outside
it (`1262`). A `<section>` is a landmark only when it has an accessible name, and
only the galleries do, via `aria-labelledby` (`index.html:1137`, `1176`). About,
education, skills, projects, photography, organizations, stats and contact are
plain sections, so landmark navigation skips them.

Outline: `h1` (`1051`), one `h2` per section (`1074`, `1081`, `1084`, `1095`,
`1130`, `1141`, `1180`, `1212`, `1236`), `h3` per card and slide (`1946`, `1958`,
`2027`, `2175`), then `h4` for the three stat numbers (`1218`, `1222`, `1226`).
**Gap:** `#stats` has no heading at all (`index.html:1215-1228`), so the outline
jumps `h2` to `h4` and the section is unnamed. Fix: an `sr-only` `h2`, and change
the three `h4` to `p` with the same classes.

## 2. Focus visibility

There is no global `:focus-visible` rule, so most links and buttons show the browser
ring. Six components style it: fullscreen button (`index.html:803-806`), lightbox
controls (`859-860`), gallery prev/next (`motion-gallery.css:115-120`), stage
(`154`), print (`320-328`), back to top (`index.html:2355`).

**Gap:** the two arrows in the modal's documentation carousel set
`focus:outline-none` with nothing to replace it (`index.html:1875`, `1878`), so the
indicator disappears on the controls that scroll a work gallery. Fix: drop
`focus:outline-none` from both class strings, or add
`focus-visible:ring-2 focus-visible:ring-primary`.

## 3. Focus order, and what is reachable

Focus order follows source order: nav links, CV, theme trigger, then main, footer and
the back to top button.

**Loader.** Covers the viewport at `z-index: 99999999` (`index.html:421`) and
dismisses on `mousedown` (`1530-1534`) or the quote timer (`1510-1512`). It is a
`div` with no key handler, so a keyboard user waits it out. Fix: a `keydown`
listener for `Enter` and `Space` beside the `mousedown` one.

**Desktop theme menu.** The trigger is labelled (`index.html:970`) but the panel is
`opacity-0 invisible` until hovered (`973`), and `visibility: hidden` removes its
eight buttons from the tab order, so the switcher needs a mouse. Fix:
`focus-within:visible focus-within:opacity-100` on the panel and `aria-expanded` on
the trigger.

**Mobile menu.** `#mobile-menu` is a `div` moved off-screen with `translate-x-full`
(`index.html:1016`, `1309`), never `hidden`, `inert` or `aria-hidden`. Its five
links, eight theme buttons and CV link stay in the tab order while it is closed
(`1017-1037`), so tabbing from the header walks through an invisible panel. Fix:
toggle `inert` in the two branches that toggle the class (`1302-1313`). The trigger
has no `aria-label`, `aria-expanded` or `aria-controls` (`1011`).

**Work modal, the largest gap.** `openModal` unhides the overlay and locks body
scroll (`index.html:2633-2648`) but never moves focus in, traps it, or restores it
on close (`2651-2667`). The overlay has no `role="dialog"`, no `aria-modal` and no
label (`2117`), and `Escape` is handled nowhere in the page except the lightbox
(`2745-2760`). Opening a work leaves focus on the button behind the overlay while
Tab walks the page underneath. Fix, in order: give the title `h3` an id and put
`role="dialog" aria-modal="true" aria-labelledby` on `.modal-overlay` (`2117`,
`2139`); focus the close button on open; refocus the opener on close; add `Escape`
to a document `keydown` listener. The lightbox is the pattern to copy: `role` and
`aria-modal` (`2687-2690`), focus in on open (`2775`), returned on close
(`2784-2786`).

## 4. Keyboard reachability of the galleries

Yes, the clothesline works without a pointer. The stage is focusable
(`tabindex="0"`, `index.html:1155`, `1194`); the section handles `ArrowLeft`,
`ArrowRight`, `Home` and `End` (`motion-gallery.ts:1136-1166`); `Enter` and `Space`
re-select a focused print (`1155-1160`); every print has real play and expand
buttons (`649-663`); roving tabindex keeps one print plus its two buttons in the tab
order (`1119-1125`). Drag is not the only path: the arrow buttons call the same
`goTo()` that a drag release calls (`1012-1049`).

A smaller problem. The ticks are all tabbable because `syncControls` roves the
prints and their buttons but not the ticks (`motion-gallery.ts:1119-1125`), so eight
prints mean eight tick stops before the stage; that is direct access, so the trade is
defensible, but `tabIndex = -1` would tighten it.

## 5. ARIA that is actually present

| Attribute | Where | What it does |
|---|---|---|
| `aria-labelledby` | `index.html:1137`, `1176` | names the two gallery regions after their `h2`s |
| `aria-live="polite"` | `1170`, `1209` | the `sr-only` paragraphs announcing the active print |
| `aria-roledescription` | `1155`, `1194`, `motion-gallery.ts:588` | "carousel" on the stage, "hanging print" per print |
| `aria-label` | `index.html:1145`, `1149`, `1184`, `1188`, `1848`, `2132`, `970`; generated at `motion-gallery.ts:465`, `652`, `661` | gallery prev/next, fullscreen triggers, theme trigger, ticks, play/pause and expand |
| `aria-current` | `motion-gallery.ts:1115` | marks the active tick, set at runtime |
| `aria-hidden` | `index.html:1146`, `1156`, `1162-1163`, `1855`, `1864`, `2130`, `2162` | SVG icons, drag label, skeleton, blurred copies |
| `role="dialog"`, `aria-modal` | `index.html:2687-2688` | the lightbox only |

The visible counters are `aria-hidden="true"` (`index.html:1148`, `1187`), so the
polite region is the only thing that speaks on navigation.

What is not there:

- The works carousel has no role, label or roledescription. `#cms-works-container`
  is a plain `div` (`index.html:1104`), the slides are `div`s (`2004`), and the
  counter is a `span` with no `aria-live` (`1118`) whose text changes silently
  (`2055`, `2065`).
- The prev/next buttons have no `aria-label`; their name is the icon ligature, read
  as `chevron_left` and `chevron_right` (`index.html:1109`, `1112`). The dots are
  empty buttons with no label and no `aria-current` (`2050`), so there is one
  unnamed stop per work.
- The mobile menu trigger and back to top button are named only by their icon text
  (`1011`, `2362`), and the eight theme buttons in the mobile menu are coloured
  `div`s with no text and no label (`1025-1032`). The desktop versions do have text
  (`974-998`), which is why the gap is easy to miss.

Fix for the carousel: `role="group"`, `aria-roledescription="carousel"` and
`aria-label` on `#works-slider-wrapper` (`index.html:1101`),
`aria-label="Show work n: title"` and `aria-current` on each dot, `aria-label` on
the two arrows, `aria-live="polite"` on `#works-counter`.

## 6. Skip link

There is none, and `<main>` (`index.html:1040`) has no `id`. A keyboard user tabs
through five nav links, the CV download, the theme trigger and, on mobile, the whole
off-canvas menu before reaching content. Fix: add
`<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-on-primary">Skip to content</a>`
at the top of `<body>`, plus `id="main" tabindex="-1"` on `<main>`.

## 7. Alt text strategy

The rule in use is "the container carries the name, the image is decoration", applied
correctly in the galleries and unevenly elsewhere.

| Surface | `alt` | Line |
|---|---|---|
| About portrait | a fixed English caption, hardcoded in markup | `index.html:1070` |
| Work cover, modal header, photo tile | `work.title` twice, then `photo.title`; blurred twins `aria-hidden` | `2010`, `2130-2131`, `2162` |
| Modal carousel slides | `""` on both layers | `1856`, `1865` |
| Gallery poster | `""`, with the print carrying `aria-label="n of total: title"` | `motion-gallery.ts:605`, `589` |
| Lightbox image | `"Documentation image n of total"` | `2730` |

Two real gaps. The documentation carousel in a work modal renders every slide as
`alt=""` (`index.html:1856`, `1865`), but those images are the slide content, so
they are unlabelled; pass the title and slide index into `generateCarouselHtml` and
set `alt="${work.title} documentation ${j + 1}"`. The portrait `alt` is static while
its `src` is CMS-driven (`1070`, rewritten at `1893-1901`), so swapping the photo
keeps the old description; add an `alt` column, or use `alt=""` and let the heading
carry the meaning.

## 8. Colour contrast

Ratios below are WCAG 2.1 relative-luminance ratios computed from the hex values in
the theme blocks, against `--color-surface`, which is what sits behind the text once
the hero canvas and gradient are composited. The full table is in
`docs/DESIGN-SYSTEM.md`; this section keeps only the pairs that matter.

| Pair | Where | Ratio | Verdict |
|---|---|---|---|
| Hero typewriter, light: `#006c49` on `#f8fafc` | `index.html:213`, `216`, applied at `1909` | 6.19:1 | passes AA |
| Hero typewriter, sand: `#d4af37` on `#fdf5e6` | `index.html:236`, `239`, applied at `1909` | 1.94:1 | fails 4.5:1 and fails 3:1 as large text |
| "View Projects" label, sand: same pair | `index.html:1058` | 1.94:1 | fails |
| "View Projects" border, light: `#cbd5e1` on `#f8fafc` | `index.html:224`, `216`, `1058` | 1.42:1 | fails the 3:1 non-text rule; the border is the button's only boundary |
| Footer line, light: `#475569` at 60% on `#f8fafc` | `index.html:223`, `216`, `1266` | 2.82:1 | fails 4.5:1 |

The light theme is not the failing one for the hero line. Its accent is a dark green
at 6.19:1, which passes at every size. A capture that reads as gold on cream is the
sand theme, where the same `text-primary` class resolves to `#d4af37` on `#fdf5e6`
and measures 1.94:1.

Smallest fixes. For the typewriter and every other `text-primary` label in the sand
theme, one line: darken `--color-primary` in that block to `#8a6a15`, which measures
4.67:1 on `#fdf5e6` (`index.html:236`). If the accent must stay bright, change the
typewriter class to `text-on-surface` (`index.html:1909`), which is 12.76:1 in the
sand theme and 17.06:1 in the light theme. For the outlined button, swap
`border-outline-variant` for `border-outline` (`index.html:1058`); that token is
4.55:1 in the light theme and 4.27:1 in the sand theme. The footer line is one
class: drop the `/60` at `index.html:1266`. One related trap: `text-white` is
hardcoded on the contact panel (`1234`), where nothing inherits it today but any new
child would.

## 9. `prefers-reduced-motion`

The gallery honours it properly; the rest of the page does not.

| Surface | Honours it | Where |
|---|---|---|
| Gallery springs, entrance, breeze, transitions; lightbox button fades | yes | `motion-gallery.ts:116-118`, `470-473`, `553`, `534-546`, `motion-gallery.css:681-688`, `index.html:909-913` |
| Hero typewriter, heading scramble | no | `index.html:1913-1925`, `2208-2261` |
| Scroll reveal, stagger, stat count-up | no | `index.html:443-463`, `1272-1285`, `2263-2283`, `2544-2574` |
| Canvas particles, spotlight, dot drift | no | `index.html:1342-1462`, `2816-2984`, `371-389` |
| Tilt, magnetic buttons, smooth scrolling | no | `index.html:1325-1340`, `2618-2628`, `2505`, `2539` |

Fix that covers most of it: one `matchMedia('(prefers-reduced-motion: reduce)')` check
that skips `startHeroTypewriter`, the scramble observer and the count-up, a CSS block
setting `animation: none` on `.spotlight`, `.bg-dots` and `.animate-cursor-blink`, and
`html { scroll-behavior: auto }` under the same query.

## 10. The custom cursor

`@media (pointer: fine) { * { cursor: none !important } }` (`index.html:468-472`)
removes the native pointer from every element, and two fixed `div`s draw a dot and a
lagging ring instead (`2368-2369`, script `2372-2454`).

What that costs: no I-beam over the `.md-body` prose in about, contact or a work
modal, so selectable text does not look selectable; no `grab` cursor on the gallery
stage, whose CSS sets one that the `!important` rule beats
(`motion-gallery.css:150`, compensated by the `Drag`/`Play` label at
`motion-gallery.ts:1214-1229`); no resize affordances anywhere; and no cursor over
cross-origin iframes. If the script fails or is blocked the CSS still applies, and
the page has no visible pointer at all.

Fix: move the rule behind a class the script adds, such as `html.has-custom-cursor`,
applied only once both cursor elements exist (`index.html:2386-2387`). The page then
degrades to a normal cursor instead of none.