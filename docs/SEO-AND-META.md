# SEO and meta

The head is hand-written and static. The body is rendered from the CMS at runtime. That split decides what
a search engine can read before JavaScript, what a social unfurler can read at all, and what goes stale
when the domain or the title changes.

## 1. Every tag in the head

Line numbers point at `index.html`. The build rewrites asset URLs (the favicon becomes
`/assets/favicon-<hash>.svg`) but never touches a text tag.

| Line | Tag | Value and purpose |
|---:|---|---|
| 1 | `<html lang="en">`, `class="dark scroll-smooth"` | document language; theme and smooth scroll |
| 2 | `<meta charset="utf-8">` | encoding, ahead of any non-ASCII byte |
| 3 | `<meta name="viewport">` | `width=device-width, initial-scale=1.0`, mobile layout |
| 4 | `<title>` | 75 characters decoded: "<Owner Name> \| <Professional Headline>" |
| 5 | `<meta name="description">` | 188 characters, the search snippet source |
| 8 | `<link rel="canonical">` | `https://example.com/`, the URL search consolidates on |
| 11 | `<meta property="og:type">` | `website` |
| 12 | `<meta property="og:url">` | `https://example.com/`, absolute |
| 13 | `<meta property="og:title">` | second copy of the title |
| 14 | `<meta property="og:description">` | second copy of the description |
| 15 | `<meta property="og:image">` | `https://example.com/favicon.svg`, see gap 1 |
| 18 | `<meta name="twitter:card">` | `summary_large_image`, promises a wide card |
| 19-21 | `twitter:title`, `twitter:description`, `twitter:image` | third copy of each field, image absolute |
| 23 | `<link rel="icon" type="image/svg+xml">` | `favicon.svg`, 265 bytes, hashed by the build |
| 24 | `<script src="cdn.tailwindcss.com">` | not meta, but it blocks the parser and delays what a JS crawler sees |
| 97-101 | 2 preconnects, 3 font stylesheets | `fonts.googleapis.com`, `fonts.gstatic.com`, Montserrat, Courier Prime, Material Symbols |

Measured by listing every `<meta>` in the head: the set is `description`, `og:description`, `og:image`,
`og:title`, `og:type`, `og:url`, `twitter:card`, `twitter:description`, `twitter:image`, `twitter:title`,
charset and viewport. Nothing else is declared. Absent: `robots`, `theme-color`, `author`, `og:site_name`,
`og:locale`, `og:image:alt`, `og:image:width`, `og:image:height`, `twitter:site`, `twitter:creator`,
`twitter:image:alt`, JSON-LD, `apple-touch-icon`, manifest, `hreflang`, `<link rel="me">`.

## 2. Gaps, with the exact fix

**1. `og:image` is a 265 byte SVG favicon.** X, LinkedIn and Facebook do not render SVG in a card, and
`summary_large_image` promises 2:1. Export a 1200x630 PNG or JPG under 5 MB into `public/` so it deploys at
a stable path, then replace lines 15 and 21:

```html
<meta property="og:image" content="https://example.com/og-card.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="<Owner Name>, renewable energy researcher">
<meta name="twitter:image" content="https://example.com/og-card.png">
```

**2. Title 75 characters, description 188.** Google cuts around 60 and 160. Either shorten in all three
copies or accept a cut snippet. A shorter pair, measured: "<Owner Name> | Renewable Energy
Engineer" (48) and "Renewable energy researcher and engineer working on solar, IoT, GIS and 3D
visualisation. Engineering Physics at <Institution>, Indonesia." (148).

**3. No structured data.** No `application/ld+json` and no `schema.org` string exists in any of the four
entry pages (counted 0 in each). After line 21, with `sameAs` taken from the contact links
(`index.html:1244`, `:1250`):

```html
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Person","name":"<Owner Name>",
 "url":"https://example.com/","jobTitle":"<Professional Headline>",
 "alumniOf":{"@type":"CollegeOrUniversity","name":"<Institution>"},
 "sameAs":["https://www.linkedin.com/in/<handle>/","https://www.instagram.com/<handle>/"]}
</script>
```

Those two handles are also CMS-driven (`#cms-contact-linkedin`, `#cms-contact-instagram`), so JSON-LD is a
second place to update when one changes.

**4. No `theme-color`.** The default theme is forest with `--color-background: #0b1326`
(`index.html:181-305`): `<meta name="theme-color" content="#0b1326">` after line 21. It cannot follow the
theme switcher without script.

**5. No `og:site_name`, no `twitter:site`.** Both show up in unfurls; two lines, same place.

**6. The `<h1>` has no space between its two words.** `index.html:1051` is
`<First><br><span><Last></span>`, whose text content is `<First><Last>` with no space between the two
words. The renderer rewrites it in the same shape at `index.html:1904`. Add a space before the `<br>` or use
two block spans.

**7. No `robots.txt` and no `sitemap.xml`.** Section 4.

**8. No `apple-touch-icon` or manifest.** iOS falls back to a page screenshot on "Add to Home Screen". A
180x180 PNG plus `<link rel="apple-touch-icon" href="/apple-touch-icon.png">` is the whole fix.

## 3. What a crawler actually gets

The served document, with scripts and styles stripped, holds **204 words** of visible text (counted by
removing `<script>`, `<style>` and tags from the body, then tokens). The containers the renderer owns ship
empty: `#cms-education-container` (`index.html:1081`), `#cms-skills-container` (`:1087`),
`#cms-works-container` (`:1104`), `#cms-photography-container` (`:1133`), `#cms-orgs-container` (`:1212`).

Order of events for any crawler: read the head (static, complete, duplicated by hand); parse 131,202 bytes
of inline script and wait for the Tailwind CDN; run the module and wait for 13 PostgREST reads
(`src/cms/public-content.ts:68-82`); paint. Googlebot and Bingbot run JavaScript and will see the content if
the CMS answers. X, LinkedIn, Slack, WhatsApp, iMessage and most AI crawlers do not: for them the site is
lines 4 to 21, which is why those fields matter more than the body copy.

Two consequences worth stating plainly. **Meta never follows content**: the CMS feeds the body only, so
editing the hero title in the admin changes the page and not the search snippet. **The head is duplicated by
hand**: the title exists at 4, 13 and 19, the description at 5, 14 and 20, and nothing enforces agreement.

## 4. Sitemap and robots: no files at all

Verified: no `robots.txt`, no `sitemap.xml`, no `sitemap_index.xml` in the repo root, `public/` or `dist/`,
and no `_headers` or `_redirects` either. Cloudflare Pages answers 404 for both paths, so crawlers fall
back to allow-all and discover the site by links alone. There are four routes, three of which are worth
declaring.

```text
public/robots.txt
User-agent: *
Allow: /
Disallow: /admin
Sitemap: https://example.com/sitemap.xml
```

```xml
public/sitemap.xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc><priority>1.0</priority></url>
  <url><loc>https://example.com/suitability-land-for-RE/</loc><priority>0.8</priority></url>
  <url><loc>https://example.com/meet/</loc><priority>0.5</priority></url>
</urlset>
```

`public/` is copied verbatim into `dist/` (`docs/BUILD-AND-DEPLOY.md` section 2.2), so both files land at
the domain root with no Vite change. `/admin/` already carries
`<meta name="robots" content="noindex, nofollow">` (`admin/index.html:6`); `Disallow` is the second lock.

## 5. Changing the domain or the site title

Four absolute URLs, three copies of each text field, in order:

1. Replace the domain at `index.html:8`, `:12`, `:15`, `:21`. No other source file contains it (grep over
   the four entry pages: 4 hits, all in `index.html`), so this is four lines plus a rebuild.
2. Replace the title at `:4`, `:13`, `:19`, the description at `:5`, `:14`, `:20`.
3. Update `public/robots.txt`, `public/sitemap.xml` once they exist, and the card image if it shows the
   domain.
4. Page titles of the other entries, if the site title changes: `meet/index.html:6`, `admin/index.html:8`,
   `suitability-land-for-RE/index.html:6`.
5. Point the custom domain in Cloudflare Pages, verify DNS and TLS, then announce.
6. Re-submit the sitemap in Search Console and Bing Webmaster Tools, request a re-index of `/`.

Verify after the deploy, in this order:

```bash
grep -n 'old-domain.example' index.html          # expect exactly 4 hits: 8, 12, 15, 21
grep -n '<title>' index.html meet/index.html admin/index.html suitability-land-for-RE/index.html
npm run build && grep -c 'old-domain' dist/index.html   # expect 0
curl -s https://example.com/ | grep -E 'canonical|og:url|og:title'
curl -sI https://example.com/robots.txt     # expect 200, not 404
curl -s https://example.com/og-card.png -o /dev/null -w '%{http_code} %{content_type}\n'
```

The last one catches the most common mistake: a card image that exists in the repo but returns 404 on the
domain, because it was left in the root instead of `public/`.