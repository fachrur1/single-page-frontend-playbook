# Design system

One file owns the visual system. `index.html` holds the markup, the Tailwind CDN
theme map (`index.html:102-179`), the value tokens (`index.html:188-605`) and the
component CSS (`index.html:307-914`). `docs/THEMING.md` covers runtime theme
application; this document covers the parts and how to extend them.

## 1. Design language

A Material 3 role model rendered as a dark, glassy editorial layout. Colour is
named by job, not hue: a token says "the surface a card sits on", never "the dark
grey". Glass panels float over an ambient background (fixed canvas, scattered
dots, radial spotlight, `index.html:944-947`); structure comes from hairlines, not
boxes. Motion is feedback: things arrive, lift and glow, then stop.

Six rules hold it together.

1. **Colour enters through a role token.** Values are declared on
   `:root, [data-theme="forest"]` and overridden per theme
   (`index.html:188-301, 541-605`). No rule outside those blocks may write a
   raw hex, with one deliberate exception: the swatch dots in the two switchers
   (`index.html:975-997, 1025-1032`) must show a colour that is not active.
2. **Utilities alias tokens, they never hold values.** The CDN config maps 47
   names onto `var(--color-*)` (`index.html:107-155`), so
   `bg-surface-container-high` still follows the theme.
3. **Glass is one recipe.** 40% `surface-container-high`, 16px backdrop blur,
   1px border at 50% `outline-variant` (`index.html:312-317`). Every `.glass-panel`
   inherits it; change the recipe and all of them change.
4. **Borders are hairlines.** 1px. Chrome uses `border-outline-variant/30`
   (`index.html:951, 1217`), panels the 50% mix from rule 3, and the only 2px
   outlines are focus rings (`index.html:804, 860, 2355`).
5. **Motion is feedback.** 300ms for controls, 500ms for cards and modals,
   1000ms for entrances. Nothing loops in the reading column; the loops are
   background atmosphere (`index.html:383, 405`) and the hover-only conic
   border (`index.html:352`).
6. **Type roles come in pairs.** Each role exists twice, as a family and as a
   size (`index.html:158-175`), so `font-headline-md` and `text-headline-md` are
   written together. The family half is always Montserrat.

## 2. Colour

Eighteen tokens per theme, named after Material 3 roles. All eight themes declare
the same eighteen.

| Token | Role | Where it is used |
|---|---|---|
| `--color-primary` | accent: headings, links, icons, active states | `index.html:1084, 958-962, 484` |
| `--primary-rgb` | the accent as `r, g, b` for `rgba()` | glows, dots, canvas (`index.html:319, 325, 378, 2305-2308`) |
| `--color-primary-container` | filled accent surface | `bg-primary-container/10`, `index.html:1240` |
| `--color-on-primary`, `--color-on-primary-container` | text on accent, text on accent container | CV button `index.html:1054`, selection `index.html:919` |
| `--color-background`, `--color-surface` | page background | `body` rule `index.html:308-311` |
| `--color-surface-container-lowest` .. `-highest` | five elevation steps | cards, panels, menus, modals (`index.html:1944, 973, 1217`) |
| `--color-on-surface` | primary text | `index.html:310, 1051` |
| `--color-on-surface-variant` | secondary text, captions, prose | `index.html:958, 661` |
| `--color-outline` | strong lines | gallery only, via `--mf-line` (`motion-gallery.css:15`) |
| `--color-outline-variant` | hairlines, low emphasis borders | 42 uses, `index.html:316, 951` |
| `--color-inverse-surface` | text that inverts the surface | hero title `index.html:1051`, card titles `index.html:1946` |
| `--color-inverse-on-surface`, `--color-surface-dim` | inverse text, dimmed surface | defined in all eight themes, never referenced |

Two consequences worth knowing before you touch this layer.

- The config aliases 47 names but only 18 are defined (`index.html:107-155`
  against `index.html:188-209`). The other 29, including `secondary`,
  `tertiary`, `error`, `surface-variant`, `surface-bright`, `surface-tint` and
  the `*-fixed` family, resolve to an empty value, so utilities built on them
  paint nothing. Nav links hover to `primary-fixed-dim` (`index.html:958-962`)
  and the CV button does too (`index.html:1054`), so those hovers never change.
- `--color-outline` is defined in all eight themes but has no utility consumer;
  only the gallery reads it. `outline-variant` is the working hairline token.

### Values per theme

Transcribed from `index.html:188-301` and `index.html:541-605`.

| Theme | `primary` | `background` / `surface` | `on-surface` | `on-surface-variant` | `outline-variant` |
|---|---|---|---|---|---|
| `forest` (default) | `#4edea3` | `#0b1326` | `#dae2fd` | `#bbcabf` | `#3c4a42` |
| `light` | `#006c49` | `#f8fafc` | `#0f172a` | `#475569` | `#cbd5e1` |
| `aleksandria` | `#d4af37` | `#fdf5e6` | `#3e2723` | `#5d4037` | `#d7ccc8` |
| `glacier` | `#00d4ff` | `#020617` | `#e0f2fe` | `#bae6fd` | `#38bdf8` |
| `neon-tokyo` | `#ff007f` | `#0a0118` | `#f0fdfa` | `#c4b5fd` | `#6d28d9` |
| `abyss` | `#00e5ff` | `#001219` | `#e0f2fe` | `#bae6fd` | `#005f85` |
| `sunset` | `#ff6b6b` | `#2b0b1e` | `#fee2e2` | `#fecaca` | `#9d2b67` |
| `monochrome` | `#ffffff` | `#000000` | `#ffffff` | `#cccccc` | `#444444` |

The full 18 token matrix is in `references/css-token-table.md`; do not retype it.

### Contrast

Measured with the WCAG 2.x relative luminance formula, not by eye. Body text needs
4.5:1; large text (24px, or 19px bold) needs 3:1. Section headings are
`headline-md` at 32px, so a failing accent still fails as a heading.

```js
// WCAG 2.x relative luminance, then the ratio. Pass any two hex strings.
const hex = h => [0, 2, 4].map(i => parseInt(h.slice(1 + i, 3 + i), 16) / 255);
const lin = c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const L = h => { const [r, g, b] = hex(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
```

| Theme | `on-surface` / surface | `primary` / surface | `on-primary` / `primary` |
|---|---|---|---|
| `forest` | 14.34:1 pass | 10.83:1 pass | 7.73:1 pass |
| `light` | 17.06:1 pass | 6.19:1 pass | 6.48:1 pass |
| `aleksandria` | 12.76:1 pass | **1.94:1 fail** | **2.10:1 fail** |
| `glacier` | 17.58:1 pass | 11.39:1 pass | **1.77:1 fail** |
| `neon-tokyo` | 19.54:1 pass | 5.39:1 pass | **3.78:1 fail** |
| `abyss` | 16.63:1 pass | 12.40:1 pass | 13.65:1 pass |
| `sunset` | 14.70:1 pass | 6.47:1 pass | **2.78:1 fail** |
| `monochrome` | 21.00:1 pass | 21.00:1 pass | 21.00:1 pass |

Body text is safe in all eight themes; the accent in seven. Aleksandria's gold
(`#d4af37`) on cream (`#fdf5e6`) is the real failure: it is used for headings
(`index.html:1084`), the wordmark (`index.html:955`) and every link, and 1.94:1 is
unreadable at any size. Darken `--color-primary` in that block rather than adding
an override.

The third column is the filled-button pair, `on-primary` on `primary`
(`index.html:1054`). Four themes fail 4.5:1 and three fail even 3:1, so a solid
accent button is safe only in `forest`, `light`, `abyss` and `monochrome`. Neon
Tokyo passes 3:1 and fails 4.5:1, acceptable only for 19px bold labels.

## 3. Typography

Eight size roles in the theme map (`index.html:166-175`) paired with eight family
roles (`index.html:158-165`). Every family is Montserrat, so `font-<role>` alone
changes nothing visible; the size utility does the work.

| Role | Size / line height | Tracking | Weight | Used for |
|---|---|---|---|---|
| `display-lg` | 64 / 72 | -0.02em | 700 | hero name at `md` and up (`index.html:1051`) |
| `display-lg-mobile` | 40 / 48 | -0.01em | 700 | same `h1` below `md` (`index.html:1051`) |
| `headline-md` | 32 / 40 | 0 | 600 | section headings (`index.html:1084, 1212`), mobile menu (`index.html:1017`) |
| `headline-sm` | 24 / 32 | 0 | 600 | wordmark (`index.html:955`), footer name (`index.html:1263`) |
| `body-lg` | 18 / 28 | 0 | 400 | hero subtitle only (`index.html:1052`) |
| `body-md` | 16 / 24 | 0 | 400 | nav (`index.html:958-962`), section intros (`index.html:1085`), footer (`index.html:1266`) |
| `mono-technical` | 14 / 20 | 0 | 500 | tag chips (`index.html:1961`), metadata, counters |
| `label-caps` | 12 / 16 | 0.1em | 600 | buttons (`index.html:1054, 1058, 2037`), CV link (`index.html:965`) |

Notes that matter when you add a block:

- `mono-technical` is not monospace. It is Montserrat 14/20 at weight 500
  (`index.html:160, 171`); only `typewriter` is Courier Prime (`index.html:162`).
  `font-typewriter` appears twice (`index.html:938, 1909`); `.md-body code` and
  the lightbox counter name Courier Prime directly (`index.html:724, 901`).
- `body` carries `font-headline-sm` (`index.html:919`), which sets only the
  family, so the page has no global type size; every block declares its own
  `text-*` role. Do not read that class as "body text is 24px".
- Components that predate the scale override it with `text-xs`, `text-sm` or
  `text-xl` (`index.html:2037, 2362`). Exceptions, not a second scale.
- Markdown from CMS content ignores these roles. `.md-body` hardcodes its own
  scale in px and rem (`index.html:658-690`), with `h5`/`h6` uppercase at 0.09em
  (`index.html:686-692`). To change a CMS heading, edit `.md-body`.

## 4. Scale and spacing

Six spacing tokens (`index.html:157`), all in use.

| Token | Value | Used as |
|---|---|---|
| `section-gap` | 120px | `py-section-gap` on every content section (`index.html:1065, 1081, 1091, 1127, 1212, 1232`) |
| `base` | 8px | footer gap (`index.html:1262`) |
| `margin-desktop` | 64px | `md:px-margin-desktop` (`index.html:952, 1065`) |
| `margin-mobile` | 20px | `px-margin-mobile` (`index.html:1006, 1065`) |
| `gutter` | 24px | `gap-gutter` in grids and the nav cluster (`index.html:957, 1087`) |
| `container-max` | 1280px | `max-w-container-max` (`index.html:952, 1082`) |

Section rhythm:

- Standard section: `px-margin-mobile md:px-margin-desktop py-section-gap` plus
  `max-w-container-max mx-auto`. Headings get a 4rem spacer (`mb-16`,
  `index.html:1083`) or `mb-2` and a 64px hairline (`index.html:1081`).
- Hero: `min-h-[calc(100dvh-80px)]` with `py-10 md:py-20` (`index.html:1042`),
  sized to the viewport rather than the rhythm. The nav is 80px tall in effect,
  which is the number inside that `calc` and the `pt-[80px]` on `main`
  (`index.html:1040`).
- Stats strip: `py-12` instead of `py-section-gap` (`index.html:1215`), because
  it sits between two full sections and would otherwise double the gap.

**Contained vs full-bleed.** The rule is mechanical; check the section class
before adding padding.

- Contained is the default: the `<section>` carries `max-w-container-max mx-auto`
  and the horizontal padding (`index.html:1065, 1081, 1091, 1127, 1212, 1232`),
  so content cannot reach the viewport edge.
- Full-bleed is for content that is a stage and must run edge to edge. The
  section spans the viewport and an inner `<div>` restores the container: skills
  (`index.html:1081-1088`), contact (`index.html:1232`). The galleries do it in
  CSS, `.mf-section` at `width: 100%` with `.mf-intro` capped at 1280px
  (`motion-gallery.css:26, 42-50`).
- Never mix the two. A full-bleed stage with per-child max widths produces the
  ragged gutters the galleries were written to avoid.

## 5. Shape and elevation

Radius is a four-token scale (`index.html:156`), inverted on purpose.

| Token | Value | Rendered as | Where |
|---|---|---|---|
| `DEFAULT` | 1rem | `rounded` = 16px | buttons, portrait frame (`index.html:1054, 1069`) |
| `lg` | 0.5rem | `rounded-lg` = 8px | theme dropdown (`index.html:973`) |
| `xl` | 0.75rem | `rounded-xl` = 12px | cards, contact panel (`index.html:1944, 1234`) |
| `full` | 9999px | `rounded-full` | 42 uses: pills, icon buttons, avatars |

`rounded` is larger than `rounded-lg`, and `rounded-2xl` (16px) only coincides
with `rounded` because Tailwind's default 2xl is 1rem. Content cards use
`rounded-xl` (12px), panels and modals `rounded-2xl` (16px); keep that order.

- Border: 1px, `color-mix(in srgb, var(--color-outline-variant) 50%, transparent)`
  on glass (`index.html:316`), `/30` on chrome and cards (`index.html:951`,
  `index.html:1217`), `/20` on the footer rule (`index.html:1262`). The animated border is a
  masked conic gradient at 1.5px padding, hover only, skill cards only
  (`index.html:339-359, 1955`).
- Shadows are scarce in CSS: a 15% accent hover glow (`index.html:325`), a 10px
  accent halo on the scroll bar (`index.html:617`), the lightbox image
  (`index.html:882`). The rest is `shadow-lg`/`shadow-xl`/`shadow-2xl`
  (`index.html:1069, 1108, 2005`) or an inline accent glow
  (`index.html:965, 2021`). Blur: 16px glass (`index.html:314`), 14px overlay
  (`index.html:821`), 12px media button (`index.html:791`), 10px lightbox
  controls (`index.html:843`).

Hover and active recipes, with the durations actually written:

| Recipe | Cost | Where |
|---|---|---|
| Lift 8px + accent shadow | `translateY(-8px)`, 0 20px 40px -10px at 15% accent | `.card-hover` (`index.html:321-326`) |
| Lift 4px / 8px | `hover:-translate-y-1`, `hover:-translate-y-2` | skill card (`index.html:1955`), work panel (`index.html:2021`) |
| Glow | `hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]` | work panel (`index.html:2021`) |
| Scale 1.05 / 1.10 | `group-hover:scale-105`, `group-hover:scale-110` | portrait (`index.html:1070`), contact icons (`index.html:1240`) |
| Border shift, invert | `hover:border-primary/50`, `hover:bg-primary hover:text-on-primary` | stat cards (`index.html:1217`), arrows and FAB (`index.html:1108, 2355`) |

Two faults worth knowing. `.card-hover` declares a hover transform but no
transition, and two of four call sites add no `transition-*` utility
(`index.html:1944, 2174`), so those cards jump. The contact panel hardcodes a
forest-green glow, `rgba(78,222,163,0.1)` (`index.html:1234`), wrong in seven.

## 6. Iconography

Material Symbols Outlined, one variable font (`index.html:101`): optical size
20..48, weight 100..700, fill 0..1, grade -50..200.

- Icons are ligature text inside `<span class="material-symbols-outlined">name</span>`,
  not SVG, so the glyph name is the text content (`index.html:1012, 2362`).
- Size is set per use: 18px for button glyphs (`index.html:1055`), 20px for nav
  and carousel arrows (`index.html:971`), 24px for lightbox controls
  (`index.html:862`), 28px for card icons (`index.html:1755`), 32px for skill
  icons (`index.html:1957`).
- Fill is never set. The fill axis is requested in the font URL, but no rule
  writes `font-variation-settings`, so every icon is outlined at fill 0. A filled
  state for active or toggled controls does not exist.
- CMS icon names are interpolated as text into the same span, so `solar_power`
  renders a glyph and an unknown name renders the words. Skill icons pass
  through the escaper (`${esc(skill.icon)}`, `index.html:1957`); card icons do not
  (`${block.card.icon}`, `index.html:1755`). Validate names on the way in.
- `data-icon` attributes are written in markup (`index.html:1012, 1055, 1306`)
  but nothing reads them, so ignore them. Decorative icons repeating a text label
  carry `aria-hidden="true"` (`index.html:1849, 2133`); icon-only buttons get an
  `aria-label` (`index.html:970`). Keep that split.

## 7. Motion language

| Duration | Used for |
|---|---|
| 100ms / 200ms | cursor dot and outline (`index.html:488, 501`), scroll progress (`index.html:616`), lightbox controls (`index.html:795, 844`) |
| 300 / 400ms | nav, menus, carousel arrows (`index.html:951, 1108`), magnetic button (`index.html:330`) |
| 500ms | cards, work panel, mobile menu (`index.html:2021, 1016`), section fade (`index.html:425`) |
| 700ms | image zoom inside cards (`index.html:1070, 2010`) |
| 800 / 1000ms | `.reveal` CSS fallback (`index.html:447`), section entrances and most hover recipes (21 uses of `duration-1000`) |

Easings: `ease-out` is the default (15 uses), `ease-in` appears 5 times, and two
curves are custom: `cubic-bezier(0.16, 1, 0.3, 1)` for entrances (`index.html:447,
458`), `cubic-bezier(0.25, 0.46, 0.45, 0.94)` for the magnetic button (`index.html:330`).

Opacity and transform carry almost everything. Colour transitions are allowed
(300ms on links and buttons); width, height, top and left are not, apart from the
3px scroll progress bar (`index.html:608-618`), rewritten each frame.
`will-change: transform` is set only on `.tilt-element` and `.magnetic-btn`
(`index.html:649`).

Section reveal is JS, not CSS: an `IntersectionObserver` adds `opacity-0`,
`translate-y-12`, `transition-all`, `duration-1000`, `ease-out` and swaps them on
entry (`index.html:1272-1284`); grid children repeat it with an 80ms per-index
delay (`index.html:2269-2273`).

**Reduced motion is not global.** Two guards exist: `index.html:909-913`
(lightbox controls) and `motion-gallery.css:681-688` (the clothesline). The
spotlight pulse, drifting dots, particle canvas, reveal, stagger and tilt all
keep running under `prefers-reduced-motion: reduce`. A third guard should be
global: wrap the decorative loops, leave the opacity fades.

Carousel physics, drag, snap and the clothesline belong to `docs/GALLERIES.md`.

## 8. Do and do not

1. **Do declare every colour in all eight theme blocks.** A hex inside a
   component is invisible in seven themes; see `index.html:1234`.
2. **Do reach colour through `var(--color-*)` or a colour utility.** A raw hex
   outside the token blocks cannot follow the theme, so one element stays behind
   on every switch.
3. **Do not use `primary-fixed-dim`, `secondary`, `tertiary` or any `*-fixed`
   alias.** Config-only (`index.html:107-155`), never defined, so the hover does
   nothing, as on the nav links (`index.html:958-962`).
4. **Do pair `font-<role>` with `text-<role>`.** All families are Montserrat, so
   the family class alone leaves a heading at the browser default 16px.
5. **Do use `rounded-xl` for cards and `rounded-2xl` for panels.** The scale is
   inverted (`index.html:156`); a wrong step makes nesting look inward.
6. **Do not add `prose` or `prose-*`.** The CDN build cannot register
   `@tailwindcss/typography` (`index.html:651-657`), so markdown collapses.
7. **Do not use `dark:` to mean "dark theme".** `darkMode: "class"` is on and the
   class never leaves `<html>` (`index.html:1, 104`), so `dark:` also fires in
   `light` and `aleksandria`, and panels stay dark on cream.
8. **Do use `outline-variant` for hairlines, `outline` only for a stronger
   line.** `outline` has no utility consumer and reads as a box at 1px.
9. **Do not copy `duration-1000` onto new hovers; use 300ms for controls and
   500ms for cards.** Add a `transition-*` utility wherever `.card-hover` is
   used: two sites omit it (`index.html:1944, 2174`), so the card snaps 8px.
10. **Do stay in `--color-*`; never write `--md-sys-color-*`.** Ten declarations
    use that undefined family (`index.html:185-186, 1990-1996, 2100-2106`), which
    is why the scrollbar thumb is transparent.
