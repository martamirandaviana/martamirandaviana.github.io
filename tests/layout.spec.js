// Design rules that must hold at every screen size.
import { test, expect } from "@playwright/test";
import { pages, projects } from "./site.js";

const left = (page, selector) => page.locator(selector).first().evaluate((el) => Math.round(el.getBoundingClientRect().left));

test("the header logo lines up with the page content", async ({ page }) => {
  for (const url of ["/portfolio/", "/about/", "/contact/", projects[0].url]) {
    await page.goto(url);
    const logo = await left(page, ".brand");
    const title = await left(page, "h1");
    expect(Math.abs(logo - title), `on ${url}`).toBeLessThanOrEqual(1);
  }
});

test("the hero caption fits on phones and is hidden on larger screens", async ({ page, isMobile }) => {
  await page.goto("/");
  if (!isMobile) {
    await expect(page.locator(".hero__slide.is-active .hero__text")).toBeHidden();
    return;
  }
  const overflow = await page.locator(".hero__slide").evaluateAll((slides) =>
    slides.map((s) => {
      const text = s.querySelector(".hero__text").getBoundingClientRect();
      const title = s.querySelector(".hero__title");
      return Math.round(title.scrollWidth - text.width);
    })
  );
  expect(overflow.every((o) => o <= 1), `overflow per slide: ${overflow}`).toBe(true);
});

test("the first screen shows the photo with a caption on phones and a wide frame on larger screens", async ({ page, isMobile }) => {
  await page.goto("/");
  const viewport = page.viewportSize();
  const selectors = [".hero__slide.is-active .hero__media"];
  if (isMobile) selectors.push(".hero__slide.is-active .hero__title");
  for (const selector of selectors) {
    const box = await page.locator(selector).boundingBox();
    expect(box.y + box.height, `${selector} is below the fold`).toBeLessThanOrEqual(viewport.height);
  }
  if (!isMobile) {
    const photo = await page.locator(selectors[0]).boundingBox();
    expect(photo.width).toBeGreaterThan(photo.height);
    await expect(page.locator(".site-footer__mark")).toBeHidden();
  }
});

test("long text stays at a readable line length", async ({ page }) => {
  for (const url of ["/about/"]) {
    await page.goto(url);
    // Average characters per line = line width / average character width.
    const chars = await page.locator(".prose p").first().evaluate((p) => {
      const ctx = document.createElement("canvas").getContext("2d");
      const style = getComputedStyle(p);
      ctx.font = `${style.fontSize} ${style.fontFamily}`;
      const text = p.textContent.replace(/\s+/g, " ").trim();
      return p.getBoundingClientRect().width / (ctx.measureText(text).width / text.length);
    });
    // Typography rule of thumb: 45 to 75 characters; allow up to 85.
    expect(chars, `on ${url}`).toBeLessThanOrEqual(85);
  }
});

test("project descriptions span the page margins and justify both edges", async ({ page }) => {
  for (const project of projects) {
    await page.goto(project.url);
    const body = await page.locator(".project-body").boundingBox();
    const text = await page.locator(".project-text").boundingBox();
    expect(Math.abs(text.x - body.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(text.width - body.width)).toBeLessThanOrEqual(1);
    expect(await page.locator(".project-text p").first().evaluate(p => getComputedStyle(p).textAlign)).toBe("justify");
  }
});

test("project cards show their title without hover", async ({ page }) => {
  await page.goto("/portfolio/");
  const titles = page.locator(".card__title");
  await expect(titles).toHaveCount(projects.length);
  for (const t of await titles.all()) await expect(t).toBeVisible();
});

test("pages fill the screen, so the footer is never in the middle", async ({ page }) => {
  for (const url of pages.concat("/404.html")) {
    await page.goto(url);
    const bottom = await page.locator(".site-footer").evaluate((f) => f.getBoundingClientRect().bottom + window.scrollY);
    const docHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(Math.abs(bottom - docHeight), `on ${url}`).toBeLessThanOrEqual(1);
  }
});
