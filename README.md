# portfolio-frontend-skill

Front-end engineering knowledge base for a production single-page portfolio site:
plain HTML + Tailwind CDN + vanilla JS/TypeScript modules, built by Vite, deployed
to Cloudflare Pages, with content served from Supabase (PostgREST) and a static
JSON fallback.

This repository is **documentation only**. It carries no application code, no
build, and no credentials. Every technical claim is cited to `file:line` in the
site's own source so an agent (or a new maintainer) can re-verify it in seconds.

- Audience: an AI coding agent or engineer who has to change the public page
  without breaking its rendering pipeline, its two hanging-print galleries, its
  theming, or its deploy.
- Out of scope: the admin SPA (`admin/`), the database schema, and the migration
  scripts. Those live in
  [supabase-portfolio-cms](https://github.com/fachrur1/supabase-portfolio-cms); this repo only documents the contract the
  front-end consumes.

## What the site is

One `index.html` that contains the entire public page: markup, the `<style>`
blocks holding the design tokens, an inline Tailwind CDN config, a vendored markdown
parser, and a large inline renderer that paints CMS content into `#cms-*`
containers. Two TypeScript modules are loaded as ES modules: the content loader
(`src/cms/public-content.ts`) and the hanging-print gallery
(`src/gallery/motion-gallery.ts`). Vite bundles those two plus the inline script
into a single `/assets/main-*.js` and one stylesheet.

There is no framework, no router, no state store, and no animation library. Every
motion effect is either CSS or a hand-written spring integrator.

## Table of contents

| Document | Read it when |
|---|---|
| [SKILL.md](SKILL.md) | You are an agent about to modify the site: start here. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | You need the entry points, module graph, boot sequence, or the fallback layers. |
| [docs/RENDERING.md](docs/RENDERING.md) | You touch CMS content: rows -> legacy shape -> DOM, the markdown/typography contract, the works carousel and its modal. |
| [docs/GALLERIES.md](docs/GALLERIES.md) | You touch `#motion` or `#render-3d`: layout math, drag, breeze physics, rotation. |
| [docs/THEMING.md](docs/THEMING.md) | You add or change a colour, a token, or a theme, including why `prose` does nothing here. |
| [docs/BUILD-AND-DEPLOY.md](docs/BUILD-AND-DEPLOY.md) | You run a build, add an entry point, or ship to Cloudflare Pages. |
| [docs/TESTING.md](docs/TESTING.md) | You need to prove a change works: node test suites and puppeteer browser gates. |
| [docs/PITFALLS.md](docs/PITFALLS.md) | Something is subtly broken. Numbered symptoms and fixes. |
| [docs/SCREENSHOTS.md](docs/SCREENSHOTS.md) | You want an illustrated tour of the finished page. |
| [references/dom-hooks.md](references/dom-hooks.md) | You need the exact id / data attribute / global for a hook. |
| [references/css-token-table.md](references/css-token-table.md) | You need every design token and its value per theme. |
| [references/qa-handles.md](references/qa-handles.md) | You want to drive the page from a browser test. |

## How an AI coding agent should load this

Load in this order, and stop as soon as the task is covered:

1. **`SKILL.md`** first. It is the playbook: invariants, the rendering
   pipeline, the hook map, the verification protocol, and the pitfall shortlist.
   It is written as rules, not narrative, so it can be followed directly.
2. **The one topic doc** that matches the task (`RENDERING`, `GALLERIES`,
   `THEMING`, `BUILD-AND-DEPLOY`, `TESTING`). Do not load all five.
3. **`references/*`** only when you need an exact identifier or a token value:
   they are lookup tables, not reading material.
4. **`docs/PITFALLS.md`** before declaring the change done. It is the cheapest
   way to avoid the failure modes that have already bitten this codebase.

Recommended agent protocol:

```text
read SKILL.md
  -> identify the layer being touched (content / renderer / gallery / theme / build)
  -> open the matching docs/*.md
  -> cite file:line for every claim you make about current behaviour
  -> change the smallest surface that satisfies the task
  -> run the gate that covers it (docs/TESTING.md), quote real output
  -> re-read docs/PITFALLS.md checklist
```

## Conventions used in these docs

- Citations are `path:line` relative to the site repository root, e.g.
  `src/gallery/motion-gallery.ts:947`. Line numbers are accurate for the working tree these docs were written
  against; when a line has moved, search for the cited identifier instead.
- The site owner and their content are never quoted. Content is referred to as
  "CMS rows" or "the site owner"; the production domain and the Cloudflare
  project name are deliberately kept out of the text and pointed at by citation.
- Diagrams are mermaid code fences and render on GitHub.
- "Renderer" means the inline `<script>` at `index.html:1542-2289`. "Gallery"
  means `src/gallery/motion-gallery.ts`. "Shape" means `src/cms/shape.js`.