#!/usr/bin/env node
// ============================================================================
// tools/capture.mjs - reproducible screenshot and clip capture for the docs.
//
// Runs against a LOCAL BUILD of the site whose content is fictional. It refuses
// to write anything if the page still carries an identity string listed in the
// redaction file, so a published screenshot cannot leak personal data.
//
// Requirements
//   - a production build of the site served over HTTP (any static server)
//   - puppeteer available in the directory you run it from
//   - ffmpeg for the clips (only for --video)
//
// Usage (from a checkout that has puppeteer installed)
//   node tools/capture.mjs --base http://localhost:8787 \
//        --out docs/images --media docs/media \
//        --redactions demo/redactions.local.json \
//        --ffmpeg "/c/Program Files/FFmpeg/bin/ffmpeg"
//
// Flags
//   --only 01,05,15   re-shoot selected stills (prefix match)
//   --video           also record the two clips
//   --skip-video      stills only (default when --video is absent)
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import puppeteer from 'puppeteer';

/* -------------------------------------------------------------------------- */
/* arguments                                                                  */
/* -------------------------------------------------------------------------- */

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const BASE = arg('base', 'http://localhost:8787');
const OUT = path.resolve(arg('out', 'docs/images'));
const MEDIA = path.resolve(arg('media', 'docs/media'));
const REDACTIONS_FILE = arg('redactions', null);
const FFMPEG = arg('ffmpeg', 'ffmpeg');
const ONLY = (arg('only', '') || '').split(',').map((s) => s.trim()).filter(Boolean);
const WANT_VIDEO = process.argv.includes('--video');
const FRAMES = path.resolve(arg('frames', '.capture-frames'));

const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 1 };
const MOBILE = { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true };

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(MEDIA, { recursive: true });

const want = (key) => ONLY.length === 0 || ONLY.some((k) => key.startsWith(k));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const shot = async (page, key, name) => {
  if (!want(key)) return;
  const file = path.join(OUT, name);
  await page.screenshot({ path: file });
  console.log(`[still] ${name} ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
};

/* -------------------------------------------------------------------------- */
/* redaction                                                                  */
/* -------------------------------------------------------------------------- */

const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function loadRedactions() {
  if (!REDACTIONS_FILE || !fs.existsSync(REDACTIONS_FILE)) {
    console.log('[capture] no redaction file: assuming an all-demo build');
    return [];
  }
  const parsed = JSON.parse(fs.readFileSync(REDACTIONS_FILE, 'utf8'));
  return (parsed.redactions || []).map(([from, to]) => [new RegExp(escapeRx(from), 'gi'), to, from]);
}

/**
 * Rewrite identity strings in text nodes and in every href/src/alt/title, hide
 * the custom cursor overlays, and fail loudly if a redaction target survives.
 */
async function neutralize(page, redactions, { brandInitial = 'M' } = {}) {
  await page.evaluate((rules, initial) => {
    const style = document.createElement('style');
    style.textContent =
      '#cursor-dot,#cursor-outline,#cursor-ring,.cursor-ring,.cursor-glow,#scroll-progress{display:none!important}';
    document.head.appendChild(style);

    const map = rules.map(([pattern, replacement]) => [new RegExp(pattern, 'gi'), replacement]);

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      let value = node.nodeValue;
      for (const [rx, to] of map) value = value.replace(rx, to);
      if (value !== node.nodeValue) node.nodeValue = value;
    }

    for (const el of document.querySelectorAll('[href],[src],[alt],[title],[content]')) {
      for (const attr of ['href', 'src', 'alt', 'title', 'content']) {
        const current = el.getAttribute(attr);
        if (!current) continue;
        let value = current;
        for (const [rx, to] of map) value = value.replace(rx, to);
        if (value !== current) el.setAttribute(attr, value);
      }
    }

    for (const el of document.querySelectorAll('.w-10.h-10.bg-primary, .w-8.h-8.bg-primary')) {
      if (el.textContent.trim().length <= 2) el.textContent = initial;
    }
  }, redactions.map(([rx, to]) => [rx.source, to]), brandInitial);

  if (!redactions.length) return;
  const leak = await page.evaluate((sources) => {
    const haystack = [
      document.body.innerText,
      ...[...document.querySelectorAll('[href],[src],[alt],[title],[content]')].flatMap((el) =>
        ['href', 'src', 'alt', 'title', 'content'].map((a) => el.getAttribute(a) || '')
      )
    ].join('\n').toLowerCase();
    return sources.filter((src) => haystack.includes(src.toLowerCase()));
  }, redactions.map(([, , src]) => src));
  if (leak.length) throw new Error(`redaction failed for ${leak.join(', ')}`);
}

/* -------------------------------------------------------------------------- */
/* page helpers                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The hero intro is typed character by character. Switching a theme re-renders
 * the hero, which restarts the typing, so a theme shot can catch it half typed.
 * Wait until the text stops growing, then reuse that full string for every frame.
 */
async function settleTypewriter(page, timeoutMs = 25000) {
  const start = Date.now();
  let last = -1;
  let stable = 0;
  while (Date.now() - start < timeoutMs) {
    const len = await page.evaluate(
      () => document.getElementById('cms-hero-desc')?.textContent?.replace(/\|$/, '').length || 0
    );
    if (len === last && len > 0) {
      stable += 1;
      if (stable >= 3) break;
    } else {
      stable = 0;
      last = len;
    }
    await sleep(250);
  }
  return page.evaluate(
    () => (document.getElementById('cms-hero-desc')?.textContent || '').replace(/\|$/, '')
  );
}

async function paintFullIntro(page, text) {
  await page.evaluate((full) => {
    const el = document.getElementById('cms-hero-desc');
    if (!el || !full) return;
    el.textContent = full;
    const caret = document.createElement('span');
    caret.className = 'animate-cursor-blink font-bold text-primary';
    caret.textContent = '|';
    el.appendChild(caret);
  }, text);
}

async function openPage(browser, viewport, url, redactions) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  page.on('pageerror', (e) => console.warn('[page error]', e.message));
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForFunction(
    () => document.getElementById('cms-hero-title')?.textContent?.trim(),
    { timeout: 30000 }
  );
  await neutralize(page, redactions);
  await sleep(2600); // entrance animations
  // The intro types itself out over roughly 15 seconds. Finish it so a capture
  // never shows a word cut in half with a caret.
  const intro = await settleTypewriter(page);
  await paintFullIntro(page, intro);
  page.__intro = intro;
  return page;
}

async function reveal(page, selector, offset = 0) {
  await page.evaluate((sel, off) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`missing ${sel}`);
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72 + off, behavior: 'instant' });
  }, selector, offset);
  await sleep(1400);
}

async function assertGallery(page, selector) {
  const state = await page.evaluate((sel) => {
    const section = document.querySelector(sel);
    return {
      state: section?.getAttribute('data-mf-state') || '',
      prints: section?.querySelectorAll('.mf-print').length || 0,
      height: Math.round(section?.getBoundingClientRect().height || 0)
    };
  }, selector);
  if (state.state === 'empty' || state.height < 200) throw new Error(`${selector} did not load: ${JSON.stringify(state)}`);
  console.log(`[gallery] ${selector} ${state.prints} prints, ${state.height}px`);
}

/* -------------------------------------------------------------------------- */
/* stills                                                                     */
/* -------------------------------------------------------------------------- */

const THEMES = ['forest', 'light', 'aleksandria', 'glacier', 'neon-tokyo', 'abyss', 'sunset', 'monochrome'];

async function captureDesktop(browser, redactions) {
  const page = await openPage(browser, DESKTOP, `${BASE}/?capture=1`, redactions);

  await shot(page, '01', '01-hero.png');
  await reveal(page, '#about', -10);
  await shot(page, '02', '02-about-education.png');
  await reveal(page, '#skills');
  await shot(page, '03', '03-skills.png');
  await reveal(page, '#projects');
  await shot(page, '04', '04-works-carousel.png');

  if (want('05')) {
    await page.evaluate(() => document.querySelector('#cms-works-container button')?.click());
    await sleep(1500);
    await shot(page, '05', '05-work-modal.png');
    await page.evaluate(() => {
      const modal = document.querySelector('.modal-content');
      if (modal) modal.scrollTop = 460;
    });
    await sleep(900);
    await shot(page, '05b', '05b-work-modal-body.png');
    await page.evaluate(() => {
      const modal = document.querySelector('.modal-content');
      if (modal) modal.scrollTop = 980;
    });
    await sleep(900);
    await shot(page, '05c', '05c-work-modal-learnings.png');
    await page.evaluate(() => document.querySelector('.modal-overlay button[onclick*="closeModal"]')?.click());
    await page.waitForFunction(() => !document.querySelector('.modal-overlay:not(.hidden)'), { timeout: 10000 });
    await sleep(600);
  }

  await reveal(page, '#photography');
  await shot(page, '06', '06-photography.png');
  await reveal(page, '#motion');
  await sleep(2200);
  await assertGallery(page, '#motion');
  await shot(page, '07', '07-motion-gallery.png');
  await reveal(page, '#render-3d');
  await sleep(2200);
  await assertGallery(page, '#render-3d');
  await shot(page, '08', '08-render3d-gallery.png');
  await reveal(page, '#organizations');
  await shot(page, '09', '09-organizations-stats.png');
  await reveal(page, '#contact', -20);
  await shot(page, '10', '10-contact.png');

  // Advance the gallery one print so the counter and the swing are visible.
  if (want('11')) {
    await reveal(page, '#render-3d');
    await sleep(1800);
    const advanced = await page.evaluate(() => {
      const btn = document.querySelector('#render-3d [data-mf-next]');
      if (!btn) return false;
      btn.click();
      btn.click();
      return true;
    });
    if (advanced) {
      await sleep(2400);
      await shot(page, '11', '11-gallery-advanced.png');
    }
  }
  await page.close();
}

async function captureThemes(browser, redactions) {
  if (!THEMES.some((_, i) => want(String(15 + i)))) return;
  const page = await openPage(browser, DESKTOP, `${BASE}/?capture=1`, redactions);
  const fullIntro = await settleTypewriter(page);
  console.log(`[theme] intro settled at ${fullIntro.length} chars`);
  for (let i = 0; i < THEMES.length; i += 1) {
    const name = THEMES[i];
    if (!want(String(15 + i))) continue;
    await page.evaluate((theme) => window.setTheme?.(theme), name);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await sleep(500);
    await paintFullIntro(page, fullIntro);
    await sleep(400);
    await shot(page, String(15 + i), `${15 + i}-theme-${name}.png`);
  }
  await page.evaluate(() => window.setTheme?.('forest'));
  await page.close();
}

async function captureMobile(browser, redactions) {
  if (!['23', '24', '25', '26'].some(want)) return;
  const page = await openPage(browser, MOBILE, `${BASE}/?capture=1`, redactions);
  await shot(page, '23', '23-mobile-hero.png');
  await reveal(page, '#projects');
  await shot(page, '24', '24-mobile-works.png');
  await reveal(page, '#motion');
  await sleep(2200);
  await assertGallery(page, '#motion');
  await shot(page, '25', '25-mobile-gallery.png');
  await reveal(page, '#contact', -20);
  await shot(page, '26', '26-mobile-contact.png');
  await page.close();
}

async function captureExtra(browser, redactions) {
  const entries = [
    { key: '27', file: '27-meet.png', url: `${BASE}/meet/`, settle: 2500 },
    // The SDSS page streams a multi-megabyte model before the map renders: give it
    // time, otherwise the capture shows a loading bar at 84 percent.
    { key: '28', file: '28-suitability.png', url: `${BASE}/suitability-land-for-RE/`, settle: 12000 }
  ];
  for (const { key, file, url, settle } of entries) {
    if (!want(key)) continue;
    const page = await browser.newPage();
    await page.setViewport(DESKTOP);
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
      await sleep(settle);
      await neutralize(page, redactions);
      await sleep(800);
      await shot(page, key, file);
    } catch (err) {
      console.warn(`[still] ${file} skipped: ${err.message}`);
    }
    await page.close();
  }
}

/* -------------------------------------------------------------------------- */
/* clips                                                                      */
/* -------------------------------------------------------------------------- */

async function record(page, name, seconds, drive) {
  const dir = path.join(FRAMES, name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  const client = await page.createCDPSession();
  let index = 0;
  client.on('Page.screencastFrame', async (frame) => {
    const file = path.join(dir, `${String(index).padStart(5, '0')}.png`);
    fs.writeFileSync(file, Buffer.from(frame.data, 'base64'));
    index += 1;
    try {
      await client.send('Page.screencastFrameAck', { sessionId: frame.sessionId });
    } catch {
      /* the session closes when recording stops */
    }
  });

  await client.send('Page.startScreencast', {
    format: 'png',
    maxWidth: DESKTOP.width,
    maxHeight: DESKTOP.height,
    everyNthFrame: 1
  });
  await drive();
  await sleep(seconds * 1000);
  await client.send('Page.stopScreencast');
  await client.detach();

  if (index < 10) {
    console.warn(`[clip] ${name}: only ${index} frames, skipped`);
    return null;
  }

  const pattern = path.join(dir, '%05d.png');
  const mp4 = path.join(MEDIA, `${name}.mp4`);
  const gif = path.join(MEDIA, `${name}.gif`);

  execFileSync(FFMPEG, ['-y', '-framerate', '20', '-i', pattern, '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p', '-crf', '23', '-movflags', '+faststart', mp4], { stdio: 'ignore' });
  execFileSync(FFMPEG, ['-y', '-i', pattern, '-vf',
    'fps=12,scale=900:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer',
    '-loop', '0', gif], { stdio: 'ignore' });

  console.log(`[clip] ${name}: ${index} frames -> ${(fs.statSync(mp4).size / 1024 / 1024).toFixed(1)} MB mp4, ${(fs.statSync(gif).size / 1024 / 1024).toFixed(1)} MB gif`);
  return { mp4, gif };
}

async function captureClips(browser, redactions) {
  /* 1. Drag the clothesline, then advance with the arrow buttons. */
  const page = await openPage(browser, DESKTOP, `${BASE}/?capture=1`, redactions);
  await reveal(page, '#render-3d');
  await sleep(2000);
  await record(page, 'gallery-drag', 1.2, async () => {
    const box = await page.evaluate(() => {
      const stage = document.querySelector('#render-3d [data-mf-stage]') || document.querySelector('#render-3d');
      const r = stage.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    await page.mouse.move(box.x, box.y);
    await page.mouse.down();
    for (let i = 1; i <= 24; i += 1) {
      await page.mouse.move(box.x - i * 14, box.y + Math.sin(i / 4) * 6);
      await sleep(24);
    }
    await page.mouse.up();
    await sleep(500);
    await page.evaluate(() => document.querySelector('#render-3d [data-mf-next]')?.click());
  });
  await page.close();

  /* 2. Cycle the eight themes on the hero. */
  const hero = await openPage(browser, DESKTOP, `${BASE}/?capture=1`, redactions);
  await hero.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await sleep(600);
  await record(hero, 'theme-cycle', 0.4, async () => {
    for (const theme of THEMES) {
      await hero.evaluate((t) => window.setTheme?.(t), theme);
      await sleep(250);
      await paintFullIntro(hero, hero.__intro || '');
      await sleep(450);
    }
    await hero.evaluate(() => window.setTheme?.('forest'));
  });
  await hero.close();
}

/* -------------------------------------------------------------------------- */
/* main                                                                       */
/* -------------------------------------------------------------------------- */

async function main() {
  const redactions = loadRedactions();
  console.log(`[capture] ${redactions.length} redaction rule(s)`);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--font-render-hinting=none', '--force-color-profile=srgb']
  });
  try {
    await captureDesktop(browser, redactions);
    await captureThemes(browser, redactions);
    await captureMobile(browser, redactions);
    await captureExtra(browser, redactions);
    if (WANT_VIDEO) await captureClips(browser, redactions);
  } finally {
    await browser.close();
  }
  console.log(`[capture] done: ${OUT}`);
}

main().catch((err) => {
  console.error('[capture] failed:', err);
  process.exit(1);
});