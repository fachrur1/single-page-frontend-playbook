# Repository history

## 2.0.0

The documentation release: coverage and media both expand substantially.

**New documents**

- `docs/DESIGN-SYSTEM.md`: colour roles for all eight themes with measured contrast
  ratios, type scale, spacing, elevation, iconography, motion language.
- `docs/COMPONENTS.md`: section-by-section inventory with the DOM contract, source field
  and states for each component.
- `docs/ACCESSIBILITY.md`: what the site does, and the measured gaps.
- `docs/PERFORMANCE.md`: real asset sizes, animation budgeting, improvement list.
- `docs/SEO-AND-META.md`: every head tag and the domain change checklist.
- `docs/COOKBOOK.md`: twelve worked recipes with verification commands.
- `docs/EXTRA-ENTRIES.md`: the two standalone pages that share the build.
- `LISTING.md`: package summary with contents, coverage, assumptions and terms.

**Media**

- Screenshots grow from 10 to 27: every section, all eight themes, mobile, both media
  galleries, gallery after advancing, two extra entry points.
- Two recorded clips: the gallery being dragged, and the theme cycle.

**Tooling**

- `tools/capture.mjs`: a reproducible capture run with a redaction gate and gallery
  readiness assertions.
- `.gitignore` for capture frames and local tooling.

**Fixed while re-capturing**

- Theme captures used to catch the hero intro half typed, because switching a theme
  restarts the typewriter. The capture run now settles the intro once and repaints it.
- The SDSS capture used to show a loading bar at 84 percent. It now waits for the model.
- `MANIFEST.md` used to state that real content was expected in the pixels. The manifest
  now documents each capture against the demo build instead.

## 1.0.0

First release: the playbook (`SKILL.md`), architecture and rendering notes, the gallery
deep dive, theming, build and deploy, testing, pitfalls, three reference tables, and ten
screenshots.