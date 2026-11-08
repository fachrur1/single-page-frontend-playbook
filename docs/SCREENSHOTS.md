# Screenshot tour

Thirty stills and two clips that document the page. They are not decoration: each one is
the fastest way to see whether a change broke a section's layout, spacing or stacking.

All captures come from a local build whose content is fictional: invented projects, a
placeholder portrait, `example.com` addresses. Nothing in them belongs to a real person.
`tools/capture.mjs` produced them and refuses to write a file while a known identity
string survives redaction, so a re-capture keeps that property.

## 1. Hero

![Hero](images/01-hero.png)

A full-height section with a centred two-line title, a subtitle, and a third line typed
out character by character with a blinking caret. Two actions follow: a filled primary
button with a download icon, and an outlined button that jumps to the works section.
Behind the text sits a canvas particle field with connection lines, paused whenever the
hero leaves the viewport. The hero has no card, border or panel, which is why it reads as
type floating in space.

## 2. About and education

![About and education](images/02-about-education.png)

A twelve-column grid: a 4:5 portrait frame on the left (the only element with a 3D
tilt-on-hover behaviour) and, on the right, a heading with a short primary-coloured rule
followed by markdown body. Below it, education renders as a two-column grid of glass
cards with a small-caps period line, an institution heading and a major line.

## 3. Skills

![Skills](images/03-skills.png)

Columns of equal-height cards, one per skill group. Each card has a Material Symbols icon,
a group title and a wrapped row of pill chips. The cards are transparent rather than
filled: a gradient border and a backing blur do the separation work.

## 4. Works carousel

![Works carousel](images/04-works-carousel.png)

One slide fills the carousel viewport: a cover image at reduced opacity, two stacked
gradients for legibility, and a centred glass panel holding category overline, title, tag
string, one-line summary and a call to action. The track is translated, not scrolled, so
there is no scrollbar. The dot row and the `n / total` counter sit below the slide, which
on a short viewport lands just outside the frame.

## 5. Work detail modal

![Modal top](images/05-work-modal.png)

![Modal body](images/05b-work-modal-body.png)

![Modal learnings](images/05c-work-modal-learnings.png)

A centred panel with its own scroll area, a close button fixed outside that area, and a
dimmed blurred backdrop. Top to bottom: media header, category overline, title, tag pills,
a bordered metadata grid, then the composed body. Sections that match the block grammar
(`Problem`, `Action`, `Outcome`, `Key Learnings`) become tinted cards with an icon and a
coloured rail. Markdown that is not a recognised header stays markdown, which is what the
numbered steps and the table show.

## 6. Photography

![Photography](images/06-photography.png)

A three-column grid of tiles. Each tile layers a blurred, scaled copy of the image behind
an `object-contain` copy, so portrait photos letterbox into the matte instead of being
cropped. A caption fades in on hover. The heading and description above the grid are CMS
copy written with `textContent`, which is why they never contain markup.

## 7. Motion gallery

![Motion gallery](images/07-motion-gallery.png)

A clothesline pinned between two points, drawn as an SVG curve that sags in the middle,
with clip marks above each print. Prints hang from their top edge at slightly different
angles, sized so the active one is largest; the neighbours stay partially visible, which
is what communicates that the row continues. Each print carries a media badge and a
caption block. Above the stage: eyebrow, heading, subtitle, `01 / n` counter and two round
arrow buttons. Portrait clips hang as tall narrow prints, wide clips as short wide ones.

## 8. Render gallery

![Rendered studies](images/08-render3d-gallery.png)

The same clothesline, second instance, stills only. No play control on any print, because
these are images. Sizing rules are identical, which is the point: both sections share one
class and must stay visually consistent.

## 9. Gallery after advancing

![Gallery advanced](images/11-gallery-advanced.png)

Two clicks on the next arrow: the third print is now active, the counter reads `03 / 05`,
and the print that was centre has been pushed to the side. The line has already settled,
which is what the component does once the pointer rests.

![Gallery drag](media/gallery-drag.gif)

The drag clip shows the same behaviour continuously. A pointer drag swings the whole line;
the ambient breeze only touches prints that are not active, which is why the centre plate
stays level while its neighbours sway.

## 10. Organizations and stats

![Organizations and stats](images/09-organizations-stats.png)

Two organization cards, then three stat panels that count up when they scroll into view.
The numbers are rewritten from real content counts at render time, so the digits match the
number of works and organizations on the page.

## 11. Contact

![Contact](images/10-contact.png)

One wide glass panel with a CMS heading, a markdown body, and contact rows separated by
vertical hairlines on desktop. The email and the social entries come from the CMS, not
from the markup, so hiding a link in the admin removes it here.

## 12. Themes

Eight captures of the same hero, one per theme. This is the cheapest way to check that a
new component uses tokens instead of hardcoded colours.

| Theme | Capture |
|---|---|
| forest (default) | ![forest](images/15-theme-forest.png) |
| light | ![light](images/16-theme-light.png) |
| aleksandria | ![aleksandria](images/17-theme-aleksandria.png) |
| glacier | ![glacier](images/18-theme-glacier.png) |
| neon-tokyo | ![neon tokyo](images/19-theme-neon-tokyo.png) |
| abyss | ![abyss](images/20-theme-abyss.png) |
| sunset | ![sunset](images/21-theme-sunset.png) |
| monochrome | ![monochrome](images/22-theme-monochrome.png) |

![Theme cycle](media/theme-cycle.gif)

The cycle clip plays all eight in order. The `aleksandria` theme (the sand palette) is
the one where the monospace intro line lands at 1.94:1, because the accent gold sits on
cream. That gap, and the fix, are measured in [ACCESSIBILITY.md](ACCESSIBILITY.md).

## 13. Mobile

| | | |
|---|---|---|
| ![Mobile hero](images/23-mobile-hero.png) | ![Mobile works](images/24-mobile-works.png) | ![Mobile gallery](images/25-mobile-gallery.png) |

At 390px the desktop nav becomes a slim header with a logo mark and a menu button; the
menu is an off-canvas panel with the same links plus a theme grid. The hero title drops to
the mobile type scale, actions stack full width, and the particle canvas still runs.
Nothing overflows horizontally: the page sets `overflow-x-hidden` and the galleries are
laid out from measured widths rather than fixed sizes.

![Mobile contact](images/26-mobile-contact.png)

## 14. Extra entry points

| | |
|---|---|
| ![Aru Meet](images/27-meet.png) | ![Suitability SDSS](images/28-suitability.png) |

Two standalone pages ship from the same Vite build. They share the deployment, not the
renderer. Details in [EXTRA-ENTRIES.md](EXTRA-ENTRIES.md).

## Capture notes

| Requirement | Detail |
|---|---|
| Viewport | desktop 1440x900, mobile 390x844 (`isMobile`, `hasTouch`) |
| Content | wait for `#cms-hero-title` to have text, not for a fixed timeout |
| Intro line | the hero intro types itself over about 15 seconds and restarts on a theme switch; wait for it to stop growing, then reuse that string for every theme frame |
| Galleries | wait for `data-mf-state="ready"` and give the staggered entrance about 2 seconds |
| Scroll state | yank each section so its top edge clears the fixed header |
| Modal | close it through its own button; Escape is not bound |
| Cursor | hide `#cursor-dot` and `#cursor-outline`, or they land in the middle of a section |
| Themes | capture the hero per theme with `window.setTheme(name)`, then restore `forest` |

The exact readiness condition for each file is in
[images/MANIFEST.md](images/MANIFEST.md).