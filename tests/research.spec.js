import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const options = [
  "/research/",
  "/research/previews/editorial/",
  "/research/previews/dossier/",
  "/research/previews/themes/",
];
const title = /Collective Ownership and Cooperative Housing under Rights of Use/;

test("The theme thumbnails remain readable at narrow widths", async ({ page }) => {
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 1024 });
    await page.goto("/research/");
    await page.evaluate(() => document.fonts.ready);
    await page.locator(".research-theme-visual--composite").scrollIntoViewIfNeeded();
    const frame = await page.locator(".research-theme-visual--composite").boundingBox();
    const images = page.locator(".research-theme-visual--composite img");
    await expect(images).toHaveCount(2);
    for (const image of await images.all()) {
      await image.scrollIntoViewIfNeeded();
      await expect(image).toBeVisible();
      await image.evaluate(img => img.decode());
      expect(await image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
      const bounds = await image.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(frame.x);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(frame.x + frame.width + 1);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(frame.y + frame.height + 1);
    }
    expect(frame.x + frame.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  }
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
