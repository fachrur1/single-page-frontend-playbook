# DOM hooks

Every id, data attribute and global the page depends on, with who writes it and
who reads it. Use this instead of grepping: it is the complete list as of the
current tree.

## 1. Section anchors

These ids are scroll targets and are also used by the nav highlighting and by
`window.observeElements`. They carry layout, spacing and the reveal animation.

| Id | Element | Markup |
|---|---|---|
| `home` | hero section | `index.html:1042` |
| `about` | about section | `index.html:1065` |
| `education` | education section | `index.html:1081` |
| `skills` | skills section | `index.html:1081` |
| `projects` | works section (carousel lives here) | `index.html:1091` |
| `photography` | photography section | `index.html:1127` |
| `motion` | first gallery | `index.html:1137` |
| `render-3d` | second gallery | `index.html:1176` |
| `organizations` | organizations section | `index.html:1212` |
| `stats` | stats band | `index.html:1215` |
| `contact` | contact section | `index.html:1232` |

Note that `#education` and `#skills` are separate sections that start on the
same source line (`index.html:1081`); the nav links to both (`index.html:958-962`).

## 2. Containers the renderer writes

All writes happen inside the renderer IIFE (`index.html:1542-2289`). "Kind" is
how the value is applied: `text` = `textContent`, `html` = `innerHTML` after
`esc()`/`md()`, `attr` = attribute assignment.

| Id | Kind | Source field | Writer |
|---|---|---|---|
| `cms-hero-title` | html (escaped, one `<br>` and one `<span>`) | `hero.title_line1`, `hero.title_line2` | `index.html:1904` |
| `cms-hero-subtitle` | text | `hero.subtitle` | `index.html:1905` |
| `cms-hero-desc` | html (escaped, typewriter) | `hero.description` | `index.html:1907-1925` |
| `cms-about-heading` | text | `about.heading` | `index.html:1935` |
| `cms-about-body` | html (`md()`) + class `text-justify` | `about.body` | `index.html:1936-1938` |
| `cms-education-container` | html (children) | `education[]` | `index.html:1941-1950` |
| `cms-skills-container` | html (children) | `skills[]` | `index.html:1952-1965` |
| `cms-works-container` | html (slides) | `works[]` | `index.html:1980-2045` |
| `works-indicators` | html (dots) | `works.length` | `index.html:2048-2052` |
| `works-counter` | text `1 / n` | `works.length` | `index.html:2055`, `2065` |
| `cms-photography-heading` | text | `photography_heading` | `index.html:1800-1804` |
| `cms-photography-description` | text | `photography_description` | `index.html:1800-1807` |
| `cms-photography-container` | html (tiles) | `photography[]` | `index.html:2157-2169` |
| `cms-orgs-container` | html (cards) | `organizations[]` | `index.html:2171-2179` |
| `cms-contact-heading` | text | `contact.heading` | `index.html:2193` |
| `cms-contact-body` | html (`md()`) + class `text-center` | `contact.body` | `index.html:2194-2196` |
| `cms-contact-email` | attr `href` + last span text | `contact.email` | `index.html:2197-2198` |
| `cms-contact-linkedin` | attr `href` | `contact.linkedin` | `index.html:2199` |
| `cms-contact-instagram` | attr `href` | `contact.instagram` | `index.html:2200` |
| `.stat-counter` (3 nodes) | attr `data-target` | `works.length`, `organizations.length`, current year | `index.html:2180-2188` |

Section copy that the gallery owns instead of the renderer:

| Id | Writer |
|---|---|
| `cms-motion-heading`, `cms-motion-description` | `applyCopy()` in `motion-gallery.ts:1517-1522`, called at `:1553` |
| `cms-render3d-heading`, `cms-render3d-description` | same function, via `data-mf-heading` / `data-mf-description` |

Those two pairs are the only copy written outside the renderer. Do not paint them
from the renderer as well: last writer wins and the two fetches race.

## 3. Declarative image slots

`[data-cms-id]` is resolved once per load, before any section is painted
(`index.html:1893-1901`): an `<img>` gets `src`, a `<source>` gets `srcset`, and
an unknown key leaves the element untouched.

| Attribute | Element | Key |
|---|---|---|
| `data-cms-id="profile_image"` | about portrait `<img>` | `imgData.profile_image` (`shape.js:301`) |

This is the only static slot today. Every other image is interpolated into
generated markup, so it needs no attribute.

## 4. Gallery hooks

Queried by `MotionGallery`'s constructor (`motion-gallery.ts:421-433`). All are
required except the copy attributes.

| Attribute / class | Element | Purpose |
|---|---|---|
| `data-mf-source="render3d"` | section | selects the data source; absent means `motion` |
| `data-mf-state` | section | `empty` (hidden) or `ready` (`motion-gallery.css:33`, `motion-gallery.ts:455`) |
| `data-mf-stage` | stage div | pointer surface and `IntersectionObserver` target |
| `.mf-track` | child of stage | prints are appended here |
| `.mf-cursor` | child of stage | `Drag` / `Play` label |
| `.mf-line-svg`, `.mf-line-path`, `.mf-pin` | child of stage | clothesline, redrawn in `measure()` |
| `data-mf-skeleton` | child of stage | removed on first mount |
| `data-mf-prev`, `data-mf-next` | buttons | navigation |
| `data-mf-counter` | span | `01 / 06` readout |
| `data-mf-ticks` | div | one `.mf-tick` button per print |
| `data-mf-live` | `p.sr-only` | polite live region |
| `data-mf-heading`, `data-mf-description` | heading, paragraph | optional CMS copy |

Print-level attributes written at build time:

| Attribute | Values | Meaning |
|---|---|---|
| `data-index` | `0..n-1` | selection on click, keyboard activation |
| `data-medium` | `final_render`, `behind_the_scenes`, `combined`, `still` | badge styling and the stills gate |
| `data-rotation` | `0`, `90`, `180`, `270` | rotation CSS selector (`motion-gallery.css:289-309`) |
| `class` | `mf-print`, plus `is-active`, `is-playing`, `is-video` | state, styled by CSS |
| `tabindex` | `0` on the active print, `-1` on the rest | roving tabindex (`:1119-1125`) |

## 5. Ids created at runtime

| Id pattern | Created by | Notes |
|---|---|---|
| `modal-work-dyn-{i}` | `openWorkModal(i)` | one per work, cached forever (`index.html:2093-2094`) |
| `carousel-modal-work-dyn-{i}` | `generateCarouselHtml()` | the horizontal strip inside a modal |
| `carousel-modal-work-dyn-{i}-counter` | `generateCarouselHtml()` | `n / total` inside the strip |
| `work-lightbox` | lightbox `build()` | created on first open only (`index.html:2684-2706`) |
| `sroot` | `sanitizeHtml()` | temporary wrapper inside an inert document, never inserted (`index.html:1571`) |

`window.__workMediaSets[containerId]` holds the resolved URL array for each
generated strip (`index.html:1844-1845`), keyed by the same container id.

## 6. Globals

| Global | Type | Defined at | Used by |
|---|---|---|---|
| `window.CMS.loadContent()` | async fn | `public-content.ts:145` | renderer (`index.html:1774`) |
| `window.CMS.isCmsConfigured()` | fn | `public-content.ts:145` | renderer (`index.html:1772`) |
| `window.MotionFrames` | handle | `motion-gallery.ts:1550` | tests, external tooling |
| `window.RenderFrames` | handle | `motion-gallery.ts:1549` | tests, external tooling |
| `window.openModal(id)` | fn | `index.html:2633` | modal open |
| `window.closeModal(id)` | fn | `index.html:2651` | backdrop and close button |
| `window.openWorkModal(i)` | fn | `index.html:2090` | work slide CTA |
| `window.goToWorkSlide(i)` | fn | `index.html:2058` | dots and arrows |
| `window.scrollCarousel(id, dir)` | fn | `index.html:1814` | modal strip arrows |
| `window.updateCarouselCounter(id, n)` | fn | `index.html:1822` | strip `scroll` handler |
| `window.generateCarouselHtml(...)` | fn | `index.html:1831` | work modal media header |
| `window.openWorkLightbox(images, i, trigger)` | fn | `index.html:2790` | lightbox open |
| `window.closeWorkLightbox()` | fn | `index.html:2791` | lightbox close |
| `window.observeElements(nodes)` | fn | `index.html:1288` | reveal for generated cards |
| `window.startHeroTypewriter()` | fn | `index.html:1913` | called by the loader (`:1492`) |
| `window.setTheme(name)` | fn | `index.html:2301` | theme buttons, `localStorage` |
| `window.particlePrimaryRgb` | string | `index.html:2308` | particle canvas colour |
| `window._setCursorPos`, `_updateHeroMouse`, `_updateParticleMouse` | fns | `index.html:2393`, `2845`, `1355` | one consolidated `mousemove` dispatcher (`:2591-2611`) |

The `_`-prefixed ones exist only to keep a single listener on `mousemove`. They
are internal; do not build features on them.

## 7. Non-CMS ids (chrome)

`#scroll-progress` (`920`), `#loader` (`923`), `#quote-text` / `#quote-author`
(`937-938`), `#particle-canvas` (`945`), `#app-content` (`949`), `#main-nav`
(`951`), `#mobile-header` (`1006`), `#mobile-menu-btn` (`1011`), `#mobile-menu`
(`1016`), `#hero-canvas` (`1045`), `#works-slider-wrapper` (`1101`),
`#works-prev` / `#works-next` (`1108-1111`), `#fab-back-to-top` (`2355`),
`#cursor-dot` / `#cursor-outline` (`2368-2369`), `#tailwind-config` (`102`),
`#theme-vars` (`181`).

## 8. Selectors that must not be renamed

| Selector | Depended on by |
|---|---|
| `.reveal` | scroll reveal observer (`index.html:1282-1285`) |
| `.card-hover`, `.glass-panel` | reveal re-application after paint (`index.html:2204-2206`) |
| `.theme-btn[data-set-theme]` | theme switcher (`index.html:2335-2346`) |
| `.nav-link` | active link highlighting (`index.html:2479-2492`) |
| `.mobile-link` | mobile menu close handler (`index.html:1315-1322`) |
| `.tilt-element` | tilt effect (`index.html:1325-1339`) |
| `.magnetic-btn` | magnetic hover (`index.html:2618-2628`) |
| `.stat-counter` | stats animation (`index.html:2563-2567`) |
| `.media-fs-btn` | delegated lightbox trigger (`index.html:2795`) |
| `.modal-overlay`, `.modal-content` | open/close transitions and tests |
| `.hide-scrollbar` | the modal strip (`index.html:1871`) |