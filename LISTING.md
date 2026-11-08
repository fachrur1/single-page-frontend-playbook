# Listing copy

Ready-to-paste copy for marketplace listings (agensi.io or similar). Numbers match the
repository as published: 27 screenshots, 2 clips, 15 documents, about 4,300 lines of
cited notes. Update this file when the repo changes.

## Title

**Front-end playbook: single-page portfolio with CMS, 8 themes, hanging-print gallery**

Short variant: **Portfolio front-end playbook (plain HTML + TS, CMS-driven)**

## Tagline

Change content without touching design, and know exactly what will break before you do.

## Short description (250 characters)

An engineering knowledge base for a production portfolio front-end: one HTML page, a
CMS content pipeline, eight themes, a spring-physics print gallery, and the browser
gates that protect them. Every claim is cited to file and line.

## Long description

Most front-end listings give you a template. This one gives you the knowledge to change
one safely.

The repository documents a live single-page portfolio that renders its content from a
CMS: one `index.html` holding markup and design tokens, a pure mapper that turns
database rows into the shape the renderer expects, and a hanging-print media gallery
written from scratch with a spring integrator instead of an animation library.

What a buyer gets:

- **The whole map.** Architecture, rendering pipeline, component inventory, design
  system, gallery physics, build and deploy, and the SEO and accessibility situation,
  including the gaps.
- **Citations, not assertions.** Every behavioural claim points at `path:line`, so a
  developer or an agent can verify it in seconds instead of trusting the prose.
- **A gallery you cannot find in a template.** Prints hang from a wire, each with its
  own phase of ambient breeze, a drag that swings the whole line, per-item rotation for
  portrait media, and a reduced-motion path that collapses all of it.
- **Eight themes on one variable layer.** No component knows a colour, so a ninth theme
  is four edits.
- **Media that proves it.** 27 screenshots across every section, all eight themes,
  mobile, and two recorded clips of the gallery and the theme switch.
- **A reproducible capture tool.** The screenshots are not hand-taken: a script drives
  the built site, and refuses to write a file if a known identity string survives
  redaction.

Honest limitations, stated in the docs: the page is a small number of large files, the
Tailwind CDN cannot load the typography plugin so `prose` classes do nothing, and
several accessibility items are still open (there is a measured list).

## Feature bullets

- CMS-driven content with a static fallback, so the page never renders empty
- Pure mapper between database rows and the renderer's expected shape
- Hanging-print carousel with spring physics, drag, ambient breeze, and rotation
- Eight themes from one token layer, no per-component colours
- Markdown rendering with an allowlist sanitiser and scheme checks
- Works carousel that merges two tables into one list and one modal
- Puppeteer gates for layout, drag, rotation, and content self-consistency
- Documented failure modes: 30 numbered pitfalls with the symptom each prevents
- Measured performance numbers with the command that produced them

## Suggested metadata

- **Category:** Documentation / Front-end engineering / Portfolio
- **Tags:** portfolio, front-end, html, typescript, vite, cms, supabase, animation,
  design-system, documentation, claude, cursor, ai-agent
- **Audience:** developers, agencies, AI coding agents
- **Licence:** MIT (text and diagrams), screenshots are demo content

## Suggested pricing tiers

| Tier | Contents | Why someone picks it |
|---|---|---|
| Starter | This repository as published | They need the map and the pitfalls |
| Pro | Repository plus a screen-share walkthrough of the gallery and the CMS pipeline | They inherit the codebase and want orientation |
| Agency | Repository plus a written change plan for their own site (one pass) | They are rebranding it for a client |

## FAQ

**Is this a template I can deploy as is?**
No. It is documentation for a front-end architecture. The site code is not included,
which is why the docs are useful: they describe the contract well enough to rebuild or
maintain it.

**Why no framework?**
Because the original had none, and the interesting engineering is in how a large single
page stays coherent: one mapper, one renderer, one gallery class. Framework advice is
everywhere; this is the other case.

**Does it include the backend?**
The admin app, database schema and RLS policies live in a separate repository
(`supabase-portfolio-cms`). This one covers the public front end.

**Are the screenshots of a real person?**
No. They were captured from a local build with a fictional dataset, and the capture tool
refuses to write a file while a known identity string survives redaction.

**Will the line numbers rot?**
Yes, eventually. That is why citations include the identifier next to the line number,
and why the conventions section tells you to search for the identifier when a line has
moved.

## Do not claim

- "production-ready template" (it is documentation)
- "WCAG AA compliant" (there is a measured gap list)
- "zero dependencies" (the gallery is dependency-free, the page loads Tailwind and fonts
  from CDNs)