// E2E checks for the ЕСТЕТ homepage (key scenarios from ux/demo-home.md and demo.md §6).
// Uses the studio Playwright in ~/.veon/tools (no project dependency). Usage: node tests/e2e.mjs [url]
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

const require = createRequire(path.join(os.homedir(), ".veon", "tools", "package.json"));
const { chromium } = require("playwright");
const url = process.argv[2] ?? "http://localhost:4321/";
let chromePath;
try { chromePath = JSON.parse(fs.readFileSync(path.join(os.homedir(), ".veon", "env.json"), "utf8")).chrome_path; } catch { /* bundled Chromium */ }

const H1 = "Мікроскопна стоматологія та імплантація в Ужгороді";
const IDS = ["hero", "directions", "first-visit", "doctors", "online", "reviews", "contacts"];
const ALLOWED = [
  /^tel:\+380662217733$/,
  /^mailto:esthete\.clinic@gmail\.com(\?subject=.+)?$/,
  /^https:\/\/wa\.me\/380662217733$/,
  /^viber:\/\/chat\?number=%2B380662217733$/,
  /^https:\/\/m\.me\/esthetee$/,
  /^https:\/\/www\.instagram\.com\/esthetedentalclinic\/$/,
  /^https:\/\/www\.facebook\.com\/esthetee\/$/,
  /^https:\/\/www\.youtube\.com\/channel\/UCH6bn7WJsDUFQVL8Tm5lGPg$/,
  /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=.+$/,
  /^#(top|main|directions|first-visit|doctors|online|reviews|contacts)$/,
];
const REC = ["R-101", "R-102", "R-107", "R-109", "R-301", "R-302", "R-303", "R-305", "R-306", "R-307", "R-404", "R-405", "R-406", "R-407", "R-408"];

let failed = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failed++;
};

const browser = await chromium.launch(chromePath ? { executablePath: chromePath } : {});
try {
  // 1. Content and links at 1440
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(url, { waitUntil: "load" });
  const facts = await page.evaluate(() => ({
    h1: [...document.querySelectorAll("h1")].map((h) => h.textContent?.trim()),
    ids: [...document.querySelectorAll("main > section[id]")].map((s) => s.id),
    hrefs: [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href") ?? ""),
    srcs: [...document.querySelectorAll("img, source")].flatMap((i) => [i.getAttribute("src"), i.getAttribute("srcset")]).filter(Boolean),
    robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "",
    lang: document.documentElement.lang,
    recs: [...document.querySelectorAll("[data-rec]")].flatMap((e) => (e.getAttribute("data-rec") ?? "").split(",")),
    jsonld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent ?? "{}")["@type"]),
    future: [...document.querySelectorAll(".future-link")].every((f) => f.getAttribute("aria-disabled") === "true" && !f.hasAttribute("href")),
    futureCount: document.querySelectorAll(".future-link").length,
    formBtn: document.querySelector(".request button")?.getAttribute("aria-disabled"),
    hint: document.getElementById("request-hint")?.textContent ?? "",
    text: document.body.innerText,
    imgsNoAlt: [...document.querySelectorAll("img")].filter((i) => !i.hasAttribute("alt")).length,
  }));
  check("one H1 with the concept text", facts.h1.length === 1 && facts.h1[0] === H1, JSON.stringify(facts.h1));
  check("sections in concept order", JSON.stringify(facts.ids) === JSON.stringify(IDS), facts.ids.join(","));
  const bad = facts.hrefs.filter((h) => !ALLOWED.some((re) => re.test(h)));
  check("only allowed links (anchors and real client channels)", bad.length === 0, bad.join(" "));
  check("no link or image to the client's current domain", ![...facts.hrefs, ...facts.srcs].some((u) => /esthete\.com\.ua/i.test(u)));
  check("images are local", facts.srcs.every((s) => !/https?:\/\//.test(s)));
  check("noindex and lang uk", /noindex/.test(facts.robots) && facts.lang === "uk");
  check("data-rec for every shown recommendation", REC.every((r) => facts.recs.includes(r)), REC.filter((r) => !facts.recs.includes(r)).join(","));
  check("JSON-LD Dentist", facts.jsonld.includes("Dentist"));
  check("FutureLink inactive, no href", facts.future && facts.futureCount >= 10, `${facts.futureCount} items`);
  check("form button inactive with the hint", facts.formBtn === "true" && facts.hint.includes("Онлайн-заявка з'явиться в повній версії сайту"));
  check("no demo/AI labels, no Forbes", !/\bдемо\b|\bdemo\b|\bAI\b|Forbes/i.test(facts.text));
  check("all images have alt", facts.imgsNoAlt === 0);
  check("no runtime errors", errors.length === 0, errors.join(" | "));

  // FutureLink note on hover
  const fl = page.locator(".site-footer .future-link").first();
  await fl.scrollIntoViewIfNeeded();
  await fl.hover();
  await page.waitForTimeout(300);
  const noteOpacity = await fl.locator(".future-link__note").evaluate((n) => getComputedStyle(n).opacity);
  check("FutureLink shows «Розділ у розробці» on hover", noteOpacity === "1");

  // Anchor from the menu lands on the block below the sticky header
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('.site-nav a[href="#contacts"]');
  // wait until the smooth scroll settles
  for (let i = 0, last = -1; i < 40; i++) {
    await page.waitForTimeout(150);
    const y = await page.evaluate(() => window.scrollY);
    if (y === last) break;
    last = y;
  }
  const { top, atEnd } = await page.evaluate(() => ({
    top: document.getElementById("contacts")?.getBoundingClientRect().top ?? -1,
    atEnd: Math.ceil(window.scrollY + innerHeight) >= document.documentElement.scrollHeight - 2,
  }));
  // the last block may sit lower when the page cannot scroll further
  check("menu anchor scrolls to #contacts under the header", top >= 72 - 2 && (top < 120 || atEnd), `top=${Math.round(top)}, end=${atEnd}`);
  await page.close();

  // 2. No horizontal scroll, key controls inside the screen
  for (const w of [320, 375, 390, 768, 1024, 1280, 1440]) {
    const p = await browser.newPage({ viewport: { width: w, height: 800 } });
    await p.goto(url, { waitUntil: "load" });
    const r = await p.evaluate(() => {
      const out = (el) => { if (!el) return false; const b = el.getBoundingClientRect(); return b.width > 0 && (b.left < -1 || b.right > innerWidth + 1); };
      const visible = (el) => !!el && el.getBoundingClientRect().width > 0;
      const keys = [...document.querySelectorAll(".site-header a, .site-header button, .hero .btn, #hero h1")].filter(visible);
      return {
        overflow: document.documentElement.scrollWidth - innerWidth,
        outside: keys.filter(out).map((e) => e.className || e.tagName),
        ctaInFold: (() => { const b = document.querySelector(".hero .btn--primary")?.getBoundingClientRect(); return !!b && b.bottom <= innerHeight; })(),
      };
    });
    check(`${w}px: no horizontal scroll`, r.overflow <= 0, `${r.overflow}px`);
    check(`${w}px: header and hero controls fully on screen`, r.outside.length === 0, r.outside.join(","));
    if (w <= 390 || w >= 1280) check(`${w}px: call button on the first screen`, r.ctaInFold);
    await p.close();
  }

  // 3. Mobile menu and call bar at 390
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await m.goto(url, { waitUntil: "load" });
  const toggle = m.locator("[data-menu-toggle]");
  await toggle.click();
  check("mobile menu opens", (await toggle.getAttribute("aria-expanded")) === "true" && (await m.locator("#site-nav").isVisible()));
  await m.keyboard.press("Escape");
  check("mobile menu closes on Escape", (await toggle.getAttribute("aria-expanded")) === "false");
  await toggle.click();
  await m.click('#site-nav a[href="#online"]');
  check("menu closes after choosing an item", (await toggle.getAttribute("aria-expanded")) === "false");
  await m.waitForTimeout(900);
  const bar = await m.evaluate(() => document.querySelector("[data-callbar]")?.classList.contains("is-shown"));
  check("call bar shown after the hero", bar === true);
  await m.locator('#online a[href^="https://wa.me"]').scrollIntoViewIfNeeded();
  await m.waitForTimeout(500);
  const cover = await m.evaluate(() => {
    const bar = document.querySelector("[data-callbar]");
    const wa = document.querySelector('#online a[href^="https://wa.me"]')?.getBoundingClientRect();
    const b = bar?.getBoundingClientRect();
    return { tucked: bar?.classList.contains("is-tucked"), overlap: !!wa && !!b && b.top < wa.bottom && b.bottom > wa.top && getComputedStyle(bar).transform === "none" };
  });
  check("call bar hidden while #online buttons are on screen", cover.tucked === true && !cover.overlap);
  await m.evaluate(() => window.scrollTo(0, 0));
  await m.waitForTimeout(600);
  const current = await m.evaluate(() => document.querySelectorAll("[data-nav][aria-current]").length);
  check("no active menu item on the first screen", current === 0);
  await m.close();

  // 4. Reduced motion: everything in place
  const rm = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  await rm.goto(url, { waitUntil: "load" });
  const hidden = await rm.evaluate(() => [...document.querySelectorAll("[data-clip]")].filter((e) => getComputedStyle(e).clipPath !== "none").length);
  check("reduced motion: photos and lenses shown without clipping", hidden === 0, `${hidden} clipped`);
  await rm.close();

  // 5. No JS: content visible
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const nj = await ctx.newPage();
  await nj.goto(url, { waitUntil: "load" });
  await nj.waitForTimeout(1500); // the hero lens opening is pure CSS and runs without JS
  const njHidden = await nj.evaluate(() => [...document.querySelectorAll("[data-clip]")].filter((e) => getComputedStyle(e).clipPath !== "none" && !/circle\(50%|inset\(0/.test(getComputedStyle(e).clipPath)).length);
  const njNav = await nj.locator('.site-nav a[href="#doctors"]').isVisible();
  check("no JS: photos visible and anchors reachable", njHidden === 0 && njNav);
  await ctx.close();
} finally {
  await browser.close();
}
console.log(failed ? `RESULT: FAIL (${failed})` : "RESULT: PASS");
process.exit(failed ? 1 : 0);
