# Package summary

A factual description of what this repository contains, usable as listing text. Every
number matches the published files.

## Title

Front-end playbook for a CMS-driven single-page site

## One line

Documented architecture for a production front end: one HTML page, a CMS content
pipeline, a spring-physics print gallery, and eight themes on a single variable layer.

## Summary

The repository documents a front end that renders its content from a CMS without a
framework: one `index.html` holding markup and design tokens, a pure mapper between
database rows and the shape the renderer consumes, and a hanging-print media gallery
written from scratch around a spring integrator instead of an animation library.

The documentation covers the code as it is, including measured defects. Every behavioural
claim carries a `path:line` citation, so a claim can be checked against the source in
seconds.

## Contents

| Item | Count | Notes |
|---|---|---|
| Documents | 15 | architecture, rendering, galleries, design system, components, theming, accessibility, performance, SEO, cookbook, extra entries, build and deploy, testing, pitfalls, screenshots |
| Agent playbook | 1 | `SKILL.md`, written to be loaded as project instructions |
| Reference tables | 3 | DOM hooks, CSS tokens per theme, QA handles |
| Screenshots | 27 | desktop, mobile, eight themes, both galleries, two extra entry points |
| Screen recordings | 2 | gallery drag, theme cycle (mp4 and gif) |
| Tooling | 1 | `tools/capture.mjs`, regenerates all 31 media files |
| Total weight | 8.3 MB | mostly screenshots and clips |

## Coverage

**Data path.** PostgREST reads, the legacy shape contract, the mapper, draft filtering,
static fallback, CV link rewriting.

**Rendering.** Section-by-section DOM contract, markdown grammar, sanitisation, the works
carousel and the detail modal.

**Motion.** Spring integration, drag handling on window listeners, ambient breeze with
per-print phase, media rotation with the layout box swap, reduced-motion path.

**Design.** Eight themes with computed WCAG ratios, type scale, spacing, elevation,
iconography, motion language.

**Operations.** Build pipeline, four Vite entry points, Cloudflare Pages deployment,
custom domain verification, node suites and puppeteer gates.

**Audit.** 30 numbered pitfalls with symptoms, a measured accessibility gap list, real raw
and gzip file sizes, and the improvement list that follows from them.

## Measured highlights

- Document: 195,294 bytes raw, 46,104 bytes gzip.
- Main bundle: 35,163 bytes raw, 11,934 bytes gzip.
- Icon font: 4,011,996 bytes for the outlined variable font.
- Content hold before first paint: 2,900 ms of timer chain.
- Unreferenced deploy weight: 36 MB of images, 11 MB of models.
- Contrast: seven of eight themes pass 4.5:1 for body text, one measures 1.94:1.

## Assumptions

The documentation assumes a site built as plain HTML with a Vite build, content read from
a REST backend at runtime, and no framework in the renderer. The gallery and the token
layer are independent of the content source. The mapper section is specific to the legacy
shape contract described in `docs/RENDERING.md`.

## Included

- All documentation, diagrams and reference tables.
- The capture tool and its redaction gate.
- The full screenshot and clip set.

## Not included

- The application source. This repository documents an architecture. It is not the site
  codebase and is not deployable on its own.
- The admin dashboard, database schema and migrations, which live in the backend
  repository.
- Any credential, endpoint or account identifier.

## Licence

MIT for the text, diagrams and reference tables. Attribution is appreciated, not
required. The screenshots show demo content captured from a local build.

## Version

2.0.0. See [CHANGELOG.md](CHANGELOG.md).