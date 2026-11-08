# Components

The public page is one document with a fixed stack of sections. Every section is
static markup plus at most one container that the renderer fills. Nothing is
templated at build time, so a component is always three things: the markup, the
paint block that fills it, and the legacy field it reads.

The tables are keyed as follows:

- **DOM contract** lists the ids and data attributes that must exist. Rename one
  and the paint block either throws or silently skips.
- **Source** is the legacy shape (`textData`, `imgData`, `settingsData`) from
  `buildContentShape()` (`src/cms/shape.js:277-482`). It is never a database
  column.
- **Render** is `index.html` unless another path is given. Markup range first,
  paint block second.
- **States** uses five words: `empty` (no rows or no field), `populated`,
  `hover`, `active` (the element is the current selection), `reduced` (the
  `prefers-reduced-motion` path). A state that does not exist is listed as
  `none` rather than left out, so the absence is deliberate.

Two rules apply to the whole list and are not repeated per component:

1. All paint blocks run inside one `try` (`index.html:1793-2287`). A throw in an
   early block blanks every later section, so an empty section near the bottom
   usually means an error near the top (`docs/PITFALLS.md` 14).
2. Only the two galleries hide themselves when empty. Every other section keeps
   its static heading and shows an empty container. The exact behaviour per
   container is in the appendix.

## Hero

| | |
|---|---|
| Purpose | Name, role, one-line description, CV and works links. |
| DOM contract | `section#home` (`index.html:1042`); `#cms-hero-title`, `#cms-hero-subtitle`, `#cms-hero-desc`; `#hero-canvas`; two `.magnetic-btn` anchors. |
| Source | `textData.hero.title_line1`, `title_line2`, `subtitle`, `description` (`shape.js:433-438`). |
| States | populated: title rebuilt as two escaped lines with the second in `text-primary` (`index.html:1904`). Empty: `textData.hero` is always an object, so the block runs and writes empty strings. Hover: `hover:bg-primary-fixed-dim` on the CV button, `hover:border-primary` on View Projects. Active: none. Reduced: none, the typewriter runs regardless of the media query. |
| Render | `index.html:1042-1063`; paint `1903-1931`; canvas `2816-2984`. |

Only here: the description is typed one character at a time into `innerHTML` with
a blinking caret span (`index.html:1913-1925`), and the function that does it is
a global (`window.startHeroTypewriter`) that two callers race to invoke: the
loader after it hides (`index.html:1492`) and the renderer itself when the loader
is already gone (`index.html:1927-1930`). The hero is also the only `h1` on the
page.

## About

| | |
|---|---|
| Purpose | Portrait plus the longer positioning statement. |
| DOM contract | `section#about` (`index.html:1065`); `#cms-about-heading`, `#cms-about-body.md-body`; the portrait is `img[data-cms-id="profile_image"]` inside `.tilt-element`. |
| Source | `textData.about.heading` and `about.body` (`shape.js:439-442`); the image resolves through `imgData.profile_image` (`shape.js:301`). |
| States | populated: heading via `textContent`, body through `md()` (`index.html:1935-1938`). Empty: blank heading and empty body div, section still visible. Hover: `.tilt-element` responds to `mousemove` and the image scales on `group-hover` (`index.html:1325-1340`, `1070`). Active: none. Reduced: none, the tilt runs on every pointer. |
| Render | `index.html:1065-1079`; paint `1934-1939`; image slot rewrite `1893-1901`. |

Only here: `#cms-about-body` is the one section that receives the site-wide
alignment class. `alignClass` comes from `settingsData.text_alignment`
(`index.html:1799`, `1938`) and is appended to the element's existing `md-body`
class, so a change in `site_settings` restyles the about prose only. The modal
reads a different, non-existent field (Work modal, below).

## Education

| | |
|---|---|
| Purpose | Degree history as two-column glass cards. |
| DOM contract | `section#education` and `#cms-education-container` on a single line (`index.html:1081`); the section heading is static text in the same line, not a `#cms-*` hook. |
| Source | `textData.education[]` with `period`, `institution`, `major` (`shape.js:421-425`). |
| States | populated: one card per row (`index.html:1943-1949`). Empty array: `[]` is truthy, the block runs, `innerHTML` becomes an empty string, and the heading stays. Hover: `.card-hover` lifts and recolours the border (`index.html:321-326`). Active: none. Reduced: none. |
| Render | `index.html:1081`; paint `1941-1950`. |

Only here: the section and its container share line 1081 with the opening of
`#skills`, which is why a range for education looks like a single line. There is
no `#cms-education-heading`: the heading cannot be edited from the CMS.

## Skills

| | |
|---|---|
| Purpose | Grouped tool proficiency, one card per category, one chip per item. |
| DOM contract | `section#skills`, `#cms-skills-container` (`index.html:1081-1089`); heading and sub-line are static. |
| Source | `textData.skills[]` with `category`, `icon`, `items[]` (`shape.js:395-411`). |
| States | populated: icon plus category plus chips (`index.html:1954-1964`). Empty array: same truthy-array behaviour as education, container is cleared, heading stays. Hover: card lifts (`hover:-translate-y-1`) and each chip scales and turns primary (`1961`). Active: none. Reduced: none. |
| Render | `index.html:1081-1089`; paint `1952-1965`; stagger `2263-2283`. |

Only here: `icon` is interpolated straight into a `material-symbols-outlined`
span (`index.html:1957`), so the CMS value is a ligature name such as
`precision_manufacturing`, not a URL or an emoji. An unknown name renders the
literal word.

## Works carousel

| | |
|---|---|
| Purpose | Full-width project and experience slides with a detail modal. |
| DOM contract | `section#projects` (`index.html:1091`); `#works-slider-wrapper`, `#cms-works-container.flex`, `#works-prev`, `#works-next`, `#works-indicators`, `#works-counter` (`index.html:1101-1120`). |
| Source | `textData.works[]`: `category`, `title`, `short_desc`, `description`, `tags[]`, `image_id`, `gallery_ids[]` (`shape.js:329-341`, `359-372`). |
| States | populated: one `min-w-full` slide per row (`index.html:2004-2044`). Empty: `length > 0` is required (`index.html:1974`), so the container stays empty, the counter and dots stay empty, and both arrows are dead buttons with no listener. Hover: cover scales to 1.02, the inner panel lifts 8px and gains a primary glow (`2005-2021`). Active: the slide at `currentSlide`, plus one wide dot (`2068-2072`). Reduced: none. |
| Render | `index.html:1091-1122`; paint `1967-2084`; slide transition `2058-2073`. |

Only here: the track is moved with `transform: translateX(-n * 100%)`
(`index.html:2062`), not by scrolling, so the section has no scroll position to
restore and no `scrollLeft` to read. The carousel is circular by construction
(`index.html:2059-2060`), which is why the arrow buttons are never disabled even
though their class list carries `disabled:` styles (`index.html:1108`, `1111`).
`#projects` is also the only top-level section without the `reveal` class, so it
never fades in: it is visible from first paint (`index.html:1091`).

## Carousel controls

| | |
|---|---|
| Purpose | Move the works carousel, show position. |
| DOM contract | `#works-prev`, `#works-next` (plain buttons, no `type`), `#works-indicators` (empty div), `#works-counter` (empty span). |
| Source | none. Total is `textData.works.length` (`index.html:1977`). |
| States | populated: listeners bound once (`index.html:2075-2076`). Empty: buttons render, nothing happens. Hover: `hover:bg-primary hover:text-on-primary` (`1108`, `1111`). Active: the current dot is `w-6 h-2 bg-primary`, the rest `w-2 h-2 bg-outline-variant` (`2050`, `2070`). Reduced: none, the 500ms transform transition is unconditional. |
| Render | `index.html:1108-1119`; wiring `2058-2084`. |

Only here: navigation is index based, not DOM based. `goToWorkSlide` wraps the
index at both ends (`index.html:2059-2060`), writes the counter and rewrites
every dot's full `className` (`2065-2072`). Touch is a horizontal delta of more
than 50px with no follow and no drag state (`index.html:2079-2084`), which is
why this carousel feels different from the gallery carousel on the same page.

## Photography

| | |
|---|---|
| Purpose | A three-column grid of 16:9 stills with a hover title. |
| DOM contract | `section#photography` (`index.html:1127`); `#cms-photography-heading`, `#cms-photography-description`, `#cms-photography-container`. |
| Source | `textData.photography_heading`, `textData.photography_description` (`shape.js:471-472`), and `textData.photography[]` with `title`, `image_id` (`shape.js:414-418`, key `gal{i}`). |
| States | populated: blurred backdrop, contained image, hover overlay with the title (`index.html:2160-2167`). Empty array: container cleared, heading stays. Missing image: the tile falls back to a `[Photo: title]` panel (`2162`). Hover: image scales 1.05 and the overlay fades in. Active: none. Reduced: none. |
| Render | `index.html:1127-1134`; copy `1800-1807`; paint `2157-2169`. |

Only here: the heading and description are painted outside the section's own
block, near the top of the renderer (`index.html:1800-1807`), and they use
`!= null` rather than truthiness. An empty string in the CMS therefore blanks the
heading instead of keeping the static default, unlike every other section.

## Motion gallery

| | |
|---|---|
| Purpose | The video clothesline: hanging prints, one pegged at a time. |
| DOM contract | `section.mf-section#motion[data-mf-state]` (`index.html:1137`); `[data-mf-stage]`, `.mf-track`, `[data-mf-skeleton]`, `[data-mf-ticks]`, `[data-mf-counter]`, `[data-mf-live]`, `[data-mf-prev]`, `[data-mf-next]`, `#cms-motion-heading`, `#cms-motion-description`. |
| Source | Its own bundle, not `textData`: `motion_media` rows or `api/motion.json`, plus `motion_heading` and `motion_description` from `site_settings` (`motion-gallery.ts:1552-1559`). |
| States | empty: `data-mf-state="empty"` and `display:none` (`motion-gallery.css:33`), one of the two sections that hide themselves. Populated: `mount()` flips the state to `ready` before measuring (`motion-gallery.ts:453-455`). Hover: paper shadow deepens and the poster scales to 1.02 (`motion-gallery.css:237-244`, `279`). Active: the print under the peg, zero wind, full width (`motion-gallery.ts:850-854`, `949`). Reduced: springs instant, breeze off, entrance collapsed (`motion-gallery.ts:470-473`, `motion-gallery.css:681-688`). |
| Render | `index.html:1137-1171`; class `motion-gallery.ts:421-440` (constructor), `444-547` (mount), `582-750` (print). |

Only here: the copy is written by `applyCopy()`, which looks for
`[data-mf-heading]` first and then falls back to `#cms-motion-heading`
(`motion-gallery.ts:1517-1522`). `#motion` has no `data-mf-heading` attribute, so
it always uses the id, while `#render-3d` has both. Full mechanics are in
`docs/GALLERIES.md` and are not duplicated here.

## Render 3D gallery

| | |
|---|---|
| Purpose | The same clothesline for still renders. |
| DOM contract | `section.mf-section#render-3d[data-mf-state][data-mf-source="render3d"]` (`index.html:1176`); `data-mf-heading` and `data-mf-description` on the `h2` and `p` (`1180-1181`). |
| Source | `render_3d` rows or `api/render3d.json`, plus `render3d_heading` and `render3d_description` (`motion-gallery.ts:1524-1526`). |
| States | Identical to Motion, with one difference: prints carry no play button (`motion-gallery.ts:647-656`), so `hover` reveals only the expand control. Empty: hidden. Active: same peg behaviour. Reduced: same. |
| Render | `index.html:1176-1210`; same class. |

Only here: `data-mf-source` is the single switch between the two sections
(`motion-gallery.ts:1525`), and the still branch opens the full image in a new
tab instead of entering fullscreen (`motion-gallery.ts:740-747`). There is no
separate class and there must not be one.

## Organizations

| | |
|---|---|
| Purpose | Roles held outside coursework. |
| DOM contract | `section#organizations` and `#cms-orgs-container` on one line (`index.html:1212`); static heading. |
| Source | `textData.organizations[]` with `name`, `role` (`shape.js:427-430`). |
| States | populated: one glass card per row (`index.html:2173-2178`). Empty array: container cleared, heading stays. Hover: `.card-hover` lift. Active: none. Reduced: none. |
| Render | `index.html:1212`; paint `2171-2179`. |

Only here: the count of this array is one of the three stat numbers, written in
the same pass (`index.html:2186`). Adding an organization changes the stats
section without touching it.

## Stats

| | |
|---|---|
| Purpose | Three numbers: years, projects, organizations. |
| DOM contract | `section#stats` (`index.html:1215`); three `.stat-counter` spans with `data-target` (`1218`, `1222`, `1226`). No container id, no `#cms-*` hook. |
| Source | hardcoded `3`, `5`, `3` in markup (`index.html:1218-1227`), then overwritten from `textData`: years since 2023, `works.length`, `organizations.length` (`index.html:2180-2188`). |
| States | populated: targets rewritten only when both `works` and `organizations` exist (`2180`). Empty: the markup values remain and get counted up anyway. Hover: panel border turns primary (`1217`). Active: none. Reduced: none, the 2000ms count-up runs on every visit (`index.html:2566`). |
| Render | `index.html:1215-1230`; targets `2180-2188`; animation `2543-2574`. |

Only here: this is the one component whose CMS value never reaches the DOM as
text. The renderer sets a `data-target` attribute and a separate observer
animates from 0 to that number when the section is half visible
(`index.html:2560-2571`). The attribute, not the visible digits, is what a test
reads. The section also has no heading, only three `h4` labels.

## Contact

| | |
|---|---|
| Purpose | Closing call to action with email, LinkedIn, Instagram. |
| DOM contract | `section#contact` (`index.html:1232`); `#cms-contact-heading`, `#cms-contact-body.md-body`, `#cms-contact-email`, `#cms-contact-linkedin`, `#cms-contact-instagram`. |
| Source | `textData.contact.heading`, `body`, `email`, `linkedin`, `instagram` (`shape.js:454-460`). |
| States | populated: heading as text, body through `md()`, three `href`s through `safeHref()` (`index.html:2193-2200`). Empty: `textData.contact` is always an object, so a missing field overwrites the heading or the link text instead of keeping the static default. Hover: icon ring scales, text turns primary. Active: none. Reduced: none. |
| Render | `index.html:1232-1259`; paint `2192-2201`. |

Only here: the email link's visible label is the address itself, taken from the
last span inside the anchor (`index.html:2198`). A `mailto:` scheme is added by
the renderer, so the CMS stores a bare address, while LinkedIn and Instagram
store full URLs. All three pass through `safeHref()` (`index.html:1561-1564`),
which strips whitespace and quote characters and blanks any scheme other than
`http`, `https` or `mailto`. A blanked URL is written as an empty `href`, not as
`#`; the browser resolves an empty `href` to the current page, so a bad social
URL turns the link into a reload.

## Footer

| | |
|---|---|
| Purpose | Name and copyright line. |
| DOM contract | `footer` outside `<main>` (`index.html:1262-1268`). No id, no CMS hook. |
| Source | none. Static text. |
| States | populated: always. Empty, hover, active, reduced: none. |
| Render | `index.html:1262-1268`. |

Only here: it is the only section the CMS cannot change, including the year, which
is typed as 2026 (`index.html:1267`) rather than computed.

## Work modal

| | |
|---|---|
| Purpose | The long-form detail view for one work: media header, tags, metadata grid, themed blocks, prose. |
| DOM contract | Created on demand as `#modal-work-dyn-{i}` on `document.body` (`index.html:2093`, `2116-2149`). Openers are the slide buttons calling `openWorkModal(idx)` (`index.html:2037`). Shell classes: `.modal-overlay`, `.modal-content`; globals `openModal` / `closeModal` (`index.html:2633-2668`). |
| Source | One `textData.works[i]`: `category`, `title`, `tags[]`, `image_id`, `gallery_ids[]`, `description` parsed by `renderRichDescription` (`index.html:2114`). |
| States | populated: built once, then cached and reopened by id (`index.html:2094`, `2150`). Empty: a work with no description renders an empty body; a work with no image renders no header. Hover: the fullscreen button and the carousel arrows only (`index.html:1875-1886`). Active: `open` adds `flex`, fades to `opacity-100` and scales content to 100 (`index.html:2636-2646`). Reduced: none, the 300ms fade and scale run regardless. |
| Render | `index.html:2090-2153`; open and close `2633-2668`; body parser `1675-1762`; docs carousel `1831-1889`; lightbox `2669-2815`. |

Only here: the modal is cached, so a content edit that arrives after the first
open will not appear until reload, and the cached node is never removed. It is
also the only component that appends to `document.body` instead of filling a
container, which is why it sits outside `<main>` in DOM order and why its
`z-[100]` has to be beaten by the lightbox's `z-index: 1200`
(`index.html:813`). The body alignment reads `textData.settings?.text_alignment`
(`index.html:2092`), a field the shape never provides, so the fallback
`text-left md:text-justify` always wins (`docs/PITFALLS.md` 15).

## Shell components

Outside the section flow but part of the same page. They are listed once
because each has exactly one implementation.

| Component | Purpose | DOM contract | States | Render |
|---|---|---|---|---|
| Loader | One quote, then reveal the page | `#loader`, `#quote-text`, `#quote-author`, `#app-content` | dismisses on mousedown or after the 1500ms quote timer plus its fade (`index.html:1510-1512`, `1523-1527`, `1530-1534`); hiding adds `opacity-100` to the page shell (`1487-1491`) | `index.html:923-942`; logic `1464-1537` |
| Desktop nav | Section links, CV, theme switcher | `nav#main-nav`, `.nav-link`, `[data-set-theme]` | hidden below `md` (`index.html:951`); theme menu opens on `group-hover` only (`973`) | `index.html:951-1004` |
| Mobile header and menu | The same links as a slide-over | `#mobile-header`, `#mobile-menu-btn`, `#mobile-menu`, `.mobile-link` | closed is `translate-x-full` (`index.html:1016`); open removes the class and locks body scroll (`1302-1313`) | `index.html:1006-1038`; logic `1296-1322` |
| Theme switcher | Swap `data-theme` and persist it | `.theme-btn[data-set-theme]`, two sets | active theme is whatever `localStorage` holds (`index.html:2332`) | `index.html:968-1000`, `1022-1035`; logic `2296-2348` |
| Custom cursor | Replace the native pointer | `#cursor-dot`, `#cursor-outline` | hidden on coarse pointers (`index.html:473-477`); hover state grows the ring (`504-513`) | `index.html:2368-2369`; logic `2372-2454` |
| Scroll progress | 3px bar at the top | `#scroll-progress` | width written on every scroll (`index.html:2580-2586`) | `index.html:920`; logic `2579-2586` |
| Back to top | Return to the hero | `#fab-back-to-top`, `.progress-ring__circle` | the `visible` class is toggled (`index.html:2525-2529`) but has no CSS rule | `index.html:2354-2363`; logic `2512-2541` |
| Reveal and stagger | Section entrance | `.reveal`, `.stagger-item` | initial `opacity-0 translate-y-12` is added by script (`index.html:1282-1285`) | CSS `443-463`; logic `1269-1293`, `2263-2283` |
| Text scramble | Heading noise on first view | any `h2` in the listed sections | once per heading, then unobserved (`index.html:2247-2261`) | `index.html:2208-2261` |

The one rule for this group: none of it is addressable from the CMS. Copy in the
loader, the nav and the footer is static text, so a content change cannot reach
them.

## Appendix: `#cms-*` ids to source fields

Every id the renderer writes, the field it reads, and what the container does
when that field is empty. "Paints nothing" means `innerHTML` is set to `''` and
the surrounding static heading stays visible.

| Id | Written at | Source | When empty |
|---|---|---|---|
| `cms-hero-title` | `index.html:1904` | `textData.hero.title_line1` + `title_line2` | blank `h1` with the `<br>` still in place |
| `cms-hero-subtitle` | `1905` | `hero.subtitle` | text cleared |
| `cms-hero-desc` | `1907-1931` | `hero.description` | types nothing, caret span remains |
| `cms-about-heading` | `1935` | `about.heading` | heading blank, divider rule stays |
| `cms-about-body` | `1936-1938` | `about.body` via `md()` | paints nothing |
| `cms-education-container` | `1941-1950` | `textData.education[]` | paints nothing |
| `cms-skills-container` | `1952-1965` | `textData.skills[]` | paints nothing |
| `cms-works-container` | `1968-2084` | `textData.works[]` | untouched, because the block needs `length > 0` |
| `works-prev` | `1969`, `2075` | none | no listener bound |
| `works-next` | `1970`, `2076` | none | no listener bound |
| `works-indicators` | `1971`, `2048-2052` | `works.length` | stays empty |
| `works-counter` | `1972`, `2055`, `2065` | `works.length` | stays empty |
| `cms-photography-heading` | `1800-1804` | `photography_heading` | blanked even for `''` |
| `cms-photography-description` | `1805-1807` | `photography_description` | blanked even for `''` |
| `cms-photography-container` | `2157-2169` | `textData.photography[]` | paints nothing |
| `cms-motion-heading` | `motion-gallery.ts:1517-1522` | `motion_heading` | static markup text stays |
| `cms-motion-description` | `motion-gallery.ts:1517-1522` | `motion_description` | static markup text stays |
| `cms-render3d-heading` | `motion-gallery.ts:1517-1522` | `render3d_heading` | static markup text stays |
| `cms-render3d-description` | `motion-gallery.ts:1517-1522` | `render3d_description` | static markup text stays |
| `cms-orgs-container` | `2171-2179` | `textData.organizations[]` | paints nothing |
| `cms-contact-heading` | `2193` | `contact.heading` | blanked |
| `cms-contact-body` | `2194-2196` | `contact.body` via `md()` | paints nothing |
| `cms-contact-email` | `2197-2198` | `contact.email` | `href` becomes `mailto:` with an empty label |
| `cms-contact-linkedin` | `2199` | `contact.linkedin` | `href` becomes empty, which resolves to the current page |
| `cms-contact-instagram` | `2200` | `contact.instagram` | `href` becomes empty, which resolves to the current page |

Two hooks that are not `#cms-*` ids but work the same way:

| Hook | Written at | Source | Behaviour |
|---|---|---|---|
| `[data-cms-id]` | `index.html:1893-1901` | `imgData[key]` | rewrites `src` on `IMG`, `srcset` on `SOURCE`; leaves the element alone if the key is missing |
| `.stat-counter` | `index.html:2180-2188` | `works.length`, `organizations.length` | rewrites `data-target`, the counter animates it |

`#cms-experiences-container` appears in the stagger list (`index.html:2280`) but
exists in no markup. It is a harmless no-op left from the old separate
experiences grid, and it should not be used as a hook.