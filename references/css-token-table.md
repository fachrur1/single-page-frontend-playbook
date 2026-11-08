# CSS token reference

Two token families exist: the site palette (`--color-*` and `--primary-rgb`,
defined per theme) and the gallery's scoped tokens (`--mf-*`, defined once and
derived from the palette). Nothing else defines colour.

## 1. Palette per theme

All values transcribed from `index.html:188-301` (forest, light, aleksandria,
glacier, neon-tokyo) and `index.html:541-605` (abyss, sunset, monochrome).

| Token | forest | light | aleksandria | glacier | neon-tokyo | abyss | sunset | monochrome |
|---|---|---|---|---|---|---|---|---|
| `primary` | `#4edea3` | `#006c49` | `#d4af37` | `#00d4ff` | `#ff007f` | `#00e5ff` | `#ff6b6b` | `#ffffff` |
| `background` | `#0b1326` | `#f8fafc` | `#fdf5e6` | `#020617` | `#0a0118` | `#001219` | `#2b0b1e` | `#000000` |
| `surface` | `#0b1326` | `#f8fafc` | `#fdf5e6` | `#020617` | `#0a0118` | `#001219` | `#2b0b1e` | `#000000` |
| `surface-container-lowest` | `#060e20` | `#ffffff` | `#ffffff` | `#000000` | `#000000` | `#000000` | `#1a0512` | `#000000` |
| `surface-container-low` | `#131b2e` | `#f1f5f9` | `#faebd7` | `#0f172a` | `#15032e` | `#001f2b` | `#3b1028` | `#111111` |
| `surface-container` | `#171f33` | `#e2e8f0` | `#f5deb3` | `#1e293b` | `#200445` | `#002b3d` | `#4c1634` | `#1a1a1a` |
| `surface-container-high` | `#222a3d` | `#cbd5e1` | `#e6ccb2` | `#334155` | `#2b055d` | `#003a52` | `#601a40` | `#222222` |
| `surface-container-highest` | `#2d3449` | `#94a3b8` | `#ddb892` | `#475569` | `#3b077f` | `#004c6b` | `#75204d` | `#333333` |
| `on-surface` | `#dae2fd` | `#0f172a` | `#3e2723` | `#e0f2fe` | `#f0fdfa` | `#e0f2fe` | `#fee2e2` | `#ffffff` |
| `on-surface-variant` | `#bbcabf` | `#475569` | `#5d4037` | `#bae6fd` | `#c4b5fd` | `#bae6fd` | `#fecaca` | `#cccccc` |
| `outline` | `#86948a` | `#64748b` | `#8d6e63` | `#7dd3fc` | `#a78bfa` | `#0081a7` | `#be185d` | `#666666` |
| `outline-variant` | `#3c4a42` | `#cbd5e1` | `#d7ccc8` | `#38bdf8` | `#6d28d9` | `#005f85` | `#9d2b67` | `#444444` |
| `primary-container` | `#10b981` | `#6ffbbe` | `#ffd54f` | `#0284c7` | `#9d174d` | `#005f73` | `#831843` | `#444444` |
| `on-primary` | `#003824` | `#ffffff` | `#ffffff` | `#ffffff` | `#ffffff` | `#000000` | `#ffffff` | `#000000` |
| `on-primary-container` | `#00422b` | `#002113` | `#3e2723` | `#e0f2fe` | `#fbcfe8` | `#ccfbf1` | `#fce7f3` | `#ffffff` |
| `surface-dim` | `#0b1326` | `#e2e8f0` | `#f5deb3` | `#020617` | `#0a0118` | `#001219` | `#2b0b1e` | `#000000` |
| `inverse-surface` | `#dae2fd` | `#1e293b` | `#3e2723` | `#e0f2fe` | `#f0fdfa` | `#e0f2fe` | `#fee2e2` | `#ffffff` |
| `inverse-on-surface` | `#283044` | `#f8fafc` | `#fdf5e6` | `#020617` | `#0a0118` | `#001219` | `#2b0b1e` | `#000000` |

Read a cell as `var(--color-<token>)`, e.g. `var(--color-surface-container-high)`.

## 2. `--primary-rgb`

The same accent as a comma-separated triple, for `rgba()` in gradients, shadows
and canvas code (`index.html:319`, `325`, `378`, `2305-2308`).

| Theme | Value |
|---|---|
| forest | `78, 222, 163` |
| light | `0, 108, 73` |
| aleksandria | `212, 175, 55` |
| glacier | `0, 212, 255` |
| neon-tokyo | `255, 0, 127` |
| abyss | `0, 229, 255` |
| sunset | `255, 107, 107` |
| monochrome | `255, 255, 255` |

## 3. Non-colour scale

From the CDN config (`index.html:156-175`).

| Group | Token | Value |
|---|---|---|
| radius | `DEFAULT` | `1rem` |
| radius | `lg` | `0.5rem` |
| radius | `xl` | `0.75rem` |
| radius | `full` | `9999px` |
| spacing | `section-gap` | `120px` |
| spacing | `base` | `8px` |
| spacing | `margin-desktop` | `64px` |
| spacing | `margin-mobile` | `20px` |
| spacing | `gutter` | `24px` |
| spacing | `container-max` | `1280px` |
| type | `display-lg` | 64/72, `-0.02em`, 700 |
| type | `display-lg-mobile` | 40/48, `-0.01em`, 700 |
| type | `headline-md` | 32/40, 600 |
| type | `headline-sm` | 24/32, 600 |
| type | `body-lg` | 18/28, 400 |
| type | `body-md` | 16/24, 400 |
| type | `mono-technical` | 14/20, 500 |
| type | `label-caps` | 12/16, `0.1em`, 600 |
| family | Montserrat | display, body, label roles |
| family | Courier Prime | `typewriter`, gallery captions, counters |

Note the radius inversion: `rounded` (1rem) is larger than `rounded-lg` (0.5rem).

## 4. Gallery scoped tokens

Declared on `.mf-section` and derived from the palette, so the gallery re-themes
without a single theme-specific rule (`motion-gallery.css:9-29`).

| Token | Definition | Used for |
|---|---|---|
| `--mf-paper` | `color-mix(on-surface 9%, surface-container)` | print paper |
| `--mf-paper-edge` | `color-mix(on-surface 13%, transparent)` | paper border, nav button border |
| `--mf-ink` | `on-surface` | captions, counter |
| `--mf-ink-soft` | `on-surface-variant` | metadata line, hints |
| `--mf-line` | `color-mix(outline 55%, transparent)` | the clothesline stroke |
| `--mf-accent` | `primary` | badges, ticks, heading, focus |
| `--mf-mat` | `#05070a` | the matte behind media |
| `--mf-shadow` | `rgba(0,0,0,0.55)` | paper shadows |
| `--mf-pad` | `10px` | paper padding, mirrored by `PAD` in TS |
| `--mf-line-top` | `66px` (`44px` under 860px) | where the line is pinned |
| `--mf-sag` | `30px` (`22px` under 860px) | centre sag of the line |
| `--mf-caption-h` | `58px` (`62px` under 860px) | space reserved under a print |
| `--mf-ar` | set inline per print | media aspect ratio |
| `--mf-rot-ratio` | set inline when rotated 90/270 | media box in the swapped frame |

A change to `--mf-pad` requires changing `PAD` in `motion-gallery.ts:95` in the same
commit: the layout math derives the paper chrome from it (`CHROME`), and a
mismatch shows up as prints that are a few pixels off their neighbours.

## 5. Legacy and unused tokens

| Token | Status |
|---|---|
| `--md-sys-color-*` | referenced 10 times, never defined (`index.html:185`, `1990-1996`, `2100-2106`). Dead declarations. Use `--color-*`. |
| `--tt-felt-light`, `--tt-felt-mid`, `--tt-felt-deep` | written by `setTheme` from `FELTS` (`index.html:2312-2325`), consumed by nothing after the turntable view was removed |
| `--border-angle` | `@property` registered for the animated conic border (`index.html:334-338`) |
| `--mouse-x`, `--mouse-y` | per-panel hover glow position, written on `mousemove` (`index.html:2601-2606`) |