# Image manifest

The PNGs listed here are committed next to this file. They were captured from a
local demo build whose content is fictional (invented projects, a placeholder
portrait, `example.com` addresses), so nothing in them belongs to a real person.
If you re-capture, keep that property: the capture harness in the backend
repository refuses to write a file while a known identity string survives
redaction.

Viewports: **desktop 1440x900**, **mobile 390x844** (mobile emulation:
`isMobile: true, hasTouch: true`). Device pixel ratio 1, full page off, viewport
capture on.

| # | File | Viewport | Target section | Must show | Ready when |
|---|---|---|---|---|---|
| 01 | `01-hero.png` | desktop 1440x900 | `#home` | two-line hero title, subtitle line, typewriter description with caret, filled primary button plus outlined secondary button, particle canvas behind | `#cms-hero-title` contains text and the caret span exists |
| 02 | `02-about-education.png` | desktop 1440x900 | `#about` + `#education` | 4:5 portrait frame on the left, heading with short rule and markdown body on the right, two education glass cards below with caps period line | `#cms-about-body` has children and `#cms-education-container` has 2 children |
| 03 | `03-skills.png` | desktop 1440x900 | `#skills` | three skill cards in one row, icon plus group title, wrapped chip rows | `#cms-skills-container` has at least 3 children |
| 04 | `04-works-carousel.png` | desktop 1440x900 | `#projects` | one full slide with category overline, title, tag string, summary, `View Project` button; round arrows on both edges; the dot row and the `1 / n` counter sit just below the carousel, which can fall outside a short viewport | `#cms-works-container` has children and `#works-counter` reads `1 / n` |
| 05 | `05-work-modal.png` | desktop 1440x900 | modal on `index.html` | open modal with media header, category, title, tag pills, bordered metadata grid, at least one tinted block card with icon and left rail | `.modal-overlay .modal-content` is visible and contains a metadata field label |
| 06 | `06-photography.png` | desktop 1440x900 | `#photography` | CMS heading and description, 3-column 16:9 tiles with letterboxed images and dark matte | `#cms-photography-container` has children |
| 07 | `07-motion-gallery.png` | desktop 1440x900 | `#motion` | clothesline curve with two pins, several hanging prints at different angles, badges, captions, `01 / n` counter, arrow buttons, tick row | `#motion[data-mf-state="ready"]` and all `.mf-print` have opacity > 0.98 |
| 08 | `08-render3d-gallery.png` | desktop 1440x900 | `#render-3d` | same clothesline design with stills only, no play control on any print | `#render-3d[data-mf-state="ready"]` and `querySelectorAll('#render-3d .mf-play').length === 0` |
| 09 | `09-organizations-contact.png` | desktop 1440x900 | `#organizations` through `#contact` | two organization cards, three stat panels with settled numbers, contact panel with heading, markdown body and three link rows | `#cms-orgs-container` has children and `.stat-counter` values are non-zero |
| 10 | `10-mobile-hero.png` | mobile 390x844 | `#home` | slim mobile header with logo mark and menu button, stacked hero title, full-width stacked buttons, no horizontal scrollbar | `#cms-hero-title` contains text; `document.documentElement.scrollWidth <= window.innerWidth + 1` |

## Capture procedure

1. Build and serve: `npm run build` then `npx serve dist -l 5055`. Never capture
   from `file://`; module scripts and `fetch` fail there.
2. Open the page, wait for the loader to disappear
   (`getComputedStyle(#loader).display === 'none'`). It self-dismisses after about
   2.3 seconds, or click it once.
3. For content sections, wait for the container to have children, not for a fixed
   timeout. Counts come from the CMS.
4. Scroll the target section into view with its heading clear of the fixed header
   (add 80 to 100px of offset). Do not capture a section whose heading is hidden
   behind the bar.
5. For `#motion` and `#render-3d`, wait for `data-mf-state="ready"` **and** for
   the entrance to finish. Prints fade in staggered by 72ms with a 1.6s hold, so
   give it about 2.5 seconds after the section is on screen.
6. For `05-work-modal.png`, open the first work with
   `window.openWorkModal(0)` and wait for `.modal-overlay .modal-content`.
7. Keep the default theme. Do not inject a theme name, and do not clear
   `localStorage` between captures.
8. Crop nothing. A capture that hides the surrounding spacing is useless for
   spotting layout regressions.

## Notes for reviewers

- Personal content is expected in the pixels (the site is a personal portfolio).
  The documentation never repeats it; the images are the only place it appears.
- If a capture shows an empty grid, the content fetch failed. Check the console
  for `CMS load error` before blaming the renderer.
- If `07` or `08` shows an empty clothesline, the fallback JSON is empty and the
  section correctly hid itself (`data-mf-state="empty"`). That is the intended
  empty state, not a layout bug.