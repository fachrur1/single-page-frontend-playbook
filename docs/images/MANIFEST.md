# Image manifest

Every asset in `docs/images` and `docs/media`, with the condition that makes it correct.
`tools/capture.mjs` writes these files; this table is the contract it is written against.

Viewports: desktop 1440x900, mobile 390x844 (`isMobile`, `hasTouch`), device pixel ratio 1,
viewport capture (not full page).

## Stills

| # | File | Section | Must show | Ready when |
|---|---|---|---|---|
| 01 | `01-hero.png` | `#home` | two-line title, subtitle, completed intro line with caret, filled and outlined actions, particle canvas | `#cms-hero-title` has text and the intro text has stopped growing |
| 02 | `02-about-education.png` | `#about`, `#education` | 4:5 portrait frame, heading with rule, markdown body, two education cards | `#cms-about-body` has children and `#cms-education-container` has 2 children |
| 03 | `03-skills.png` | `#skills` | skill cards in a row, icon plus group title, wrapped chips | `#cms-skills-container` has at least 3 children |
| 04 | `04-works-carousel.png` | `#projects` | one slide with overline, title, tags, summary, call to action, arrows on both edges | `#cms-works-container` has children |
| 05 | `05-work-modal.png` | modal | media header, category, title, tag pills, metadata grid | `.modal-overlay .modal-content` visible |
| 05b | `05b-work-modal-body.png` | modal scrolled | metadata grid plus themed cards and the markdown table | `.modal-content` scrolled to about 460px |
| 05c | `05c-work-modal-learnings.png` | modal scrolled | outcome card and the key learnings list | `.modal-content` scrolled to about 980px |
| 06 | `06-photography.png` | `#photography` | CMS heading and description, tiles with letterboxed images | `#cms-photography-container` has children |
| 07 | `07-motion-gallery.png` | `#motion` | clothesline with pins, prints at different angles, badges, captions, counter, arrows | `#motion[data-mf-state="ready"]` and prints at full opacity |
| 08 | `08-render3d-gallery.png` | `#render-3d` | same design, stills only, no play control | `#render-3d[data-mf-state="ready"]` and `#render-3d .mf-play` count is 0 |
| 09 | `09-organizations-stats.png` | `#organizations`, `#stats` | two organization cards, three stat panels with settled numbers | `#cms-orgs-container` has children and counters are non-zero |
| 10 | `10-contact.png` | `#contact` | glass panel, heading, markdown body, contact rows | `#cms-contact-heading` has text |
| 11 | `11-gallery-advanced.png` | `#render-3d` after two next clicks | line swung into an S, counter advanced, previous print pushed aside | `data-mf-index` changed from 0 |
| 15 | `15-theme-forest.png` | hero, forest | default palette, complete intro line | `data-theme="forest"` |
| 16 | `16-theme-light.png` | hero, light | light palette, complete intro line | `data-theme="light"` |
| 17 | `17-theme-aleksandria.png` | hero, aleksandria | warm brown palette | `data-theme="aleksandria"` |
| 18 | `18-theme-glacier.png` | hero, glacier | cold blue palette | `data-theme="glacier"` |
| 19 | `19-theme-neon-tokyo.png` | hero, neon-tokyo | magenta palette | `data-theme="neon-tokyo"` |
| 20 | `20-theme-abyss.png` | hero, abyss | teal palette | `data-theme="abyss"` |
| 21 | `21-theme-sunset.png` | hero, sunset | crimson palette | `data-theme="sunset"` |
| 22 | `22-theme-monochrome.png` | hero, monochrome | grey palette | `data-theme="monochrome"` |
| 23 | `23-mobile-hero.png` | mobile `#home` | slim header with menu button, stacked title, full-width actions, no horizontal scroll | `document.documentElement.scrollWidth <= innerWidth + 1` |
| 24 | `24-mobile-works.png` | mobile `#projects` | single-column carousel, controls reachable | `#cms-works-container` has children |
| 25 | `25-mobile-gallery.png` | mobile `#motion` | clothesline laid out from measured widths, no overflow | `#motion[data-mf-state="ready"]` |
| 26 | `26-mobile-contact.png` | mobile `#contact` | stacked contact rows | `#cms-contact-heading` has text |
| 27 | `27-meet.png` | `/meet/` | lobby screen of the standalone meeting page | page loaded, no console error |
| 28 | `28-suitability.png` | `/suitability-land-for-RE/` | loaded map, candidate list populated, no loading bar | candidate list non-empty and the loader is gone |

## Clips

| File | Length | Content | Ready when |
|---|---|---|---|
| `media/gallery-drag.mp4`, `.gif` | about 2.3s | pointer drag swings the render gallery, then one arrow click | screenshots of `#render-3d` are already correct |
| `media/theme-cycle.mp4`, `.gif` | about 6s | all eight themes on the hero, intro line kept complete | `window.setTheme` exists |

Frames are captured through the CDP screencast API, then encoded with ffmpeg (H.264 for
mp4, a 96 colour palette for gif).

## Capture procedure

1. Build the site and serve it over HTTP. Never capture from `file://`: module scripts and
   `fetch` fail there.
2. Run `tools/capture.mjs` from a directory that has puppeteer installed, pointed at the
   served build, with a redaction file if the page chrome still carries real identity
   strings.
3. Wait on conditions, never on a fixed timeout: content containers have children,
   galleries report `data-mf-state="ready"`, the hero intro stops growing.
4. Scroll each section so its top edge clears the fixed header.
5. Hide the custom cursor overlays before any capture.
6. Crop nothing. A capture that hides the surrounding spacing is useless for spotting
   layout regressions.

## Notes for reviewers

- The content in these images is fictional by design. If you re-capture against a real
  deployment, the redaction gate is what keeps identity strings out of the files.
- An empty grid means the content fetch failed. Check the console before blaming the
  renderer.
- An empty clothesline is the intended empty state (`data-mf-state="empty"`), not a layout
  bug: a section with no published rows hides itself.