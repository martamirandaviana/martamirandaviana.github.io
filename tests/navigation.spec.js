// Header navigation, redirects, 404, sitemap.
import { test, expect } from "@playwright/test";
import { pages, projects, redirects, site } from "./site.js";

test("the menu marks the current page", async ({ page }) => {
  await page.goto("/about/");
  await expect(page.locator('.site-nav a[aria-current="page"]')).toHaveText("About");
});

test("phone menu opens, closes with Escape, and closes after a link", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Phone only");
  const toggle = page.locator(".menu-toggle");
  const nav = page.locator(".site-nav");
  await page.goto("/");
  await expect(nav).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(nav.getByRole("link", { name: "Portfolio" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(nav).toBeHidden();
  await expect(toggle).toBeFocused();
  await toggle.click();
  await nav.getByRole("link", { name: "Contact" }).click();
  await expect(page).toHaveURL(/\/contact\/$/);
  await expect(page.locator(".site-nav")).toBeHidden();
});

test("desktop shows the links and no menu button", async ({ page, isMobile }) => {
  test.skip(isMobile, "Desktop only");
  await page.goto("/");
  await expect(page.locator(".menu-toggle")).toBeHidden();
  await expect(page.locator(".site-nav").getByRole("link", { name: "Portfolio" })).toBeVisible();
});

test("previous / next links go around all projects", async ({ page }) => {
  await page.goto(projects[0].url);
  const seen = new Set();
  for (let i = 0; i < projects.length; i++) {
    seen.add(new URL(page.url()).pathname);
    await page.locator(".project-nav__link--next").click();
  }
  expect(seen.size).toBe(projects.length);
  await expect(page).toHaveURL(new RegExp(projects[0].url + "$"));
});

for (const r of redirects) {
  test(`old URL ${r.from} forwards to ${r.to}`, async ({ page }) => {
    await page.goto(r.from);
    await expect(page).toHaveURL(new RegExp(r.to + "$"));
  });
}

test("an unknown URL shows the 404 page", async ({ page }) => {
  const response = await page.goto("/does-not-exist/");
  expect(response.status()).toBe(404);
  await expect(page.locator("h1")).toHaveText("Page not found");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
});

test("the sitemap lists every page", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  for (const url of pages) expect(xml).toContain(`<loc>${site.url}${url}</loc>`);
});
