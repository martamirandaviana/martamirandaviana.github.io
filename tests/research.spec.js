import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import YAML from "yaml";

const options = [
  "/research/",
  "/research/previews/editorial/",
  "/research/previews/dossier/",
  "/research/previews/themes/",
];
const title = /Collective Ownership and Cooperative Housing under Rights of Use/;

test("Theme thumbnails share a portrait frame and show complete housing images at narrow widths", async ({ page }) => {
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 1024 });
    await page.goto("/research/");
    await page.evaluate(() => document.fonts.ready);
    const carousel = page.locator("#housing [data-research-carousel]");
    await carousel.scrollIntoViewIfNeeded();
    const frame = await carousel.boundingBox();
    for (const visual of await page.locator(".research-theme-visual").all()) {
      const bounds = await visual.boundingBox();
      expect(Math.abs(bounds.width - frame.width)).toBeLessThanOrEqual(1);
      expect(Math.abs(bounds.height - frame.height)).toBeLessThanOrEqual(1);
      expect(Math.abs(bounds.height - bounds.width * 1.5)).toBeLessThanOrEqual(1);
    }
    await expect(carousel.locator(".research-thumbnail-slide")).toHaveCount(2);
    for (let i = 0; i < 2; i++) {
      const image = carousel.locator(".research-thumbnail-slide.is-active img");
      await expect(image).toBeVisible();
      await image.evaluate(img => img.decode());
      expect(await image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
      expect(await image.evaluate(img => getComputedStyle(img).objectFit)).toBe("contain");
      const bounds = await image.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(frame.x);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(frame.x + frame.width + 1);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(frame.y + frame.height + 1);
      await carousel.getByRole("button", { name: /Show next/ }).click();
    }
    expect(frame.x + frame.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  }
});

test("hovering or focusing a housing article selects its matching image", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/research/");
  const housing = page.locator("#housing");
  const active = housing.locator(".research-thumbnail-slide.is-active");
  const iva = housing.locator('.research-entry[data-thumbnail-key="publico-cooperatives"]');
  await iva.hover();
  await expect(active).toHaveAttribute("data-thumbnail-key", "publico-cooperatives");
  await housing.locator('.research-entry[data-thumbnail-key="cooperative-housing"] h3 a').focus();
  await expect(active).toHaveAttribute("data-thumbnail-key", "cooperative-housing");
  await iva.locator("h3 a").focus();
  await expect(active).toHaveAttribute("data-thumbnail-key", "publico-cooperatives");
});

test("thumbnail images crossfade automatically and can be paused", async ({ page }) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/research/");
  const carousel = page.locator("#housing [data-research-carousel]");
  await carousel.scrollIntoViewIfNeeded();
  await expect(carousel.getByRole("button", { name: /Show next/ })).toBeVisible();
  await page.mouse.move(0, 0);
  await page.clock.runFor(100);
  await page.clock.fastForward(6100);
  const active = carousel.locator(".research-thumbnail-slide.is-active");
  await expect(active).toHaveAttribute("data-thumbnail-key", "publico-cooperatives");
  await carousel.getByRole("button", { name: /Pause/ }).click();
  await page.mouse.move(0, 0);
  await page.locator("h1").click();
  await page.clock.fastForward(13000);
  await expect(active).toHaveAttribute("data-thumbnail-key", "publico-cooperatives");
});

test("reduced motion keeps thumbnails still until the visitor changes them", async ({ page }) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/research/");
  const carousel = page.locator("#housing [data-research-carousel]");
  await carousel.scrollIntoViewIfNeeded();
  const next = carousel.getByRole("button", { name: /Show next/ });
  await expect(next).toBeVisible();
  await page.clock.fastForward(13000);
  await expect(carousel.locator(".is-active")).toHaveAttribute("data-thumbnail-key", "cooperative-housing");
  await next.click();
  await expect(carousel.locator(".is-active")).toHaveAttribute("data-thumbnail-key", "publico-cooperatives");
});

test("About lists the same publications, conferences and teaching as Research", async ({ page }) => {
  const research = YAML.parse(fs.readFileSync("src/_data/research.yml", "utf8"));
  await page.goto("/about/");
  const cv = page.locator(".cv");
  for (const record of research.publications) await expect(cv.getByRole("link", { name: record.title, exact: true })).toHaveCount(1);
  for (const conference of research.conferences) await expect(cv).toContainText(conference.title);
  for (const position of research.teaching) {
    await expect(cv.locator(".cv__entry").filter({ hasText: position.course })).toHaveCount(1);
    await expect(cv).toContainText(position.dates);
  }
});

test("swiping a thumbnail changes its image without opening an article", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/research/");
  const frame = page.locator("#housing [data-research-carousel]");
  await expect(frame.getByRole("button", { name: /Show next/ })).toBeVisible();
  await frame.scrollIntoViewIfNeeded();
  const box = await frame.boundingBox();
  const session = await page.context().newCDPSession(page);
  const y = box.y + box.height / 2;
  const start = box.x + box.width * 0.8;
  const end = box.x + box.width * 0.2;
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: start, y }] });
  await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: end, y }] });
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(frame.locator(".is-active")).toHaveAttribute("data-thumbnail-key", "publico-cooperatives");
  await expect(page).toHaveURL(/\/research\/$/);
});

test("Research is reachable from the navigation", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) await page.locator(".menu-toggle").click();
  await page.locator(".site-nav").getByRole("link", { name: "Research", exact: true }).click();
  await expect(page).toHaveURL(/\/research\/$/);
  await expect(page.locator('.site-nav a[aria-current="page"]')).toHaveText("Research");
  await expect(page.getByRole("heading", { name: "Research", exact: true })).toBeVisible();
});

for (const url of options) {
  test(`${url} shows the articles and supports reading their summaries and PDFs`, async ({ page, request }) => {
    await page.goto(url);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByRole("heading", { name: "IVA a 6% para todos: e as cooperativas, onde ficam?" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Conferences", exact: true })).toBeVisible();
    const summary = page.locator(".research-disclosure").filter({ has: page.locator("summary", { hasText: "Summary" }) }).first();
    await summary.locator("summary").click();
    await expect(summary.locator("p")).toContainText("cooperative housing");
    const citation = page.locator(".research-disclosure").filter({ has: page.locator("summary", { hasText: "Citation" }) }).first();
    await citation.locator("summary").click();
    await expect(citation.locator("p")).toContainText("Lameira");
    for (const name of ["eurau-2026-cooperative-housing", "publico-2026-housing-cooperatives"]) {
      const response = await request.get(`/assets/research/papers/${name}.pdf`);
      expect(response.status()).toBe(200);
      expect((await response.body()).subarray(0, 5).toString()).toBe("%PDF-");
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
    expect(result.violations.map(v => `${v.id}: ${v.help}`)).toEqual([]);
    if (url.includes("/previews/")) await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
  });
}

test("Research and its reading controls work without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await page.goto(baseURL + "/");
    await page.locator(".site-nav").getByRole("link", { name: "Research", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Research", exact: true })).toBeVisible();
    const summary = page.locator(".research-disclosure").first();
    await summary.locator("summary").click();
    await expect(summary.locator("p")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  } finally {
    await context.close();
  }
});
