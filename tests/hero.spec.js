// Home page slideshow.
import { test, expect } from "@playwright/test";

const INTERVAL = 6000;
const activeIndex = (page) =>
  page.locator(".hero__slide").evaluateAll((slides) => slides.findIndex((s) => s.classList.contains("is-active")));

test.beforeEach(async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  // hero.js loads asynchronously; wait until it runs before moving the clock.
  await expect(page.locator(".hero")).toHaveClass(/is-ready/);
});

test("advances on its own", async ({ page }) => {
  expect(await activeIndex(page)).toBe(0);
  await page.clock.runFor(INTERVAL + 100);
  expect(await activeIndex(page)).toBe(1);
  await page.clock.runFor(INTERVAL);
  expect(await activeIndex(page)).toBe(2);
});

test("keeps playing after a click on a dot", async ({ page }) => {
  await page.locator(".hero__dot").nth(3).click();
  expect(await activeIndex(page)).toBe(3);
  // The pointer stays over the slideshow after the click.
  await page.clock.runFor(INTERVAL + 100);
  expect(await activeIndex(page)).toBe(4);
});

test("a click on a dot restarts the full interval", async ({ page }) => {
  await page.clock.runFor(INTERVAL - 1000);
  await page.locator(".hero__dot").nth(2).click();
  await page.clock.runFor(INTERVAL - 500);
  expect(await activeIndex(page)).toBe(2);
  await page.clock.runFor(600);
  expect(await activeIndex(page)).toBe(3);
});

test("the keyboard pause control stops and restarts the slideshow", async ({ page }) => {
  const toggle = page.locator(".hero__toggle");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.press("Enter");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(toggle).toHaveAccessibleName("Play slideshow");
  await page.clock.runFor(INTERVAL * 3);
  expect(await activeIndex(page)).toBe(0);
  await toggle.press("Enter");
  await page.clock.runFor(INTERVAL + 100);
  expect(await activeIndex(page)).toBe(1);
});

test("keyboard focus inside pauses it; leaving resumes it", async ({ page, isMobile }) => {
  test.skip(isMobile, "No keyboard on phones");
  await page.locator(".hero__slide.is-active .hero__media").focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab"); // focus via keyboard, so :focus-visible applies
  await page.clock.runFor(INTERVAL * 2);
  expect(await activeIndex(page)).toBe(0);
  await page.locator(".site-footer a").first().focus();
  await page.clock.runFor(INTERVAL + 100);
  expect(await activeIndex(page)).toBe(1);
});

test("only the active slide can take focus", async ({ page }) => {
  const inert = await page.locator(".hero__slide").evaluateAll((s) => s.map((x) => x.inert));
  expect(inert[0]).toBe(false);
  expect(inert.slice(1).every(Boolean)).toBe(true);
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("starts paused, and the visitor can start it", async ({ page }) => {
    await expect(page.locator(".hero__toggle")).toHaveAttribute("aria-pressed", "true");
    await page.clock.runFor(INTERVAL * 2);
    expect(await activeIndex(page)).toBe(0);
    await page.locator(".hero__toggle").press("Enter");
    await page.clock.runFor(INTERVAL + 100);
    expect(await activeIndex(page)).toBe(1);
  });
});

// Reads the real screen pixels: a CSS value can be right while nothing shows.
async function darkestPixel(locator) {
  const sharp = (await import("sharp")).default;
  const { data } = await sharp(await locator.screenshot()).raw().toBuffer({ resolveWithObject: true });
  return Math.min(...data);
}

test("the current dot is visibly darker than the others", async ({ page }) => {
  await page.locator(".hero__dot").nth(1).click();
  // The progress line is a CSS animation, which runs in real time (the fake
  // clock only holds the JavaScript timer, so the slide does not change).
  await page.waitForTimeout(1500);
  const current = await darkestPixel(page.locator(".hero__dot").nth(1));
  const other = await darkestPixel(page.locator(".hero__dot").nth(3));
  expect(other).toBeGreaterThan(150);
  expect(current).toBeLessThan(110);
});

test.describe("with reduced motion, the current dot", () => {
  test.use({ reducedMotion: "reduce" });
  test("is marked although nothing moves", async ({ page }) => {
    expect(await darkestPixel(page.locator(".hero__dot").first())).toBeLessThan(110);
  });
});

// The home page leads straight from a photograph to its project on every size.
test("each featured photo opens its own project", async ({ page }) => {
  const dots = page.locator(".hero__dot");
  const count = await dots.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await page.goto("/");
    await expect(page.locator(".hero")).toHaveClass(/is-ready/);
    await dots.nth(i).click();
    const photo = page.locator(".hero__slide.is-active .hero__media");
    const target = await photo.getAttribute("href");
    const title = await page.locator(".hero__slide.is-active .hero__title").textContent();
    await expect(photo).toHaveAttribute("href", /^\/portfolio\/.+\/$/);
    await photo.click();
    await expect(page).toHaveURL(new URL(target, page.url()).href);
    await expect(page.locator(".project-head__title")).toHaveText(title.trim());
  }
});

test("the home page does not repeat the portfolio project list", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Portfolio", exact: true })).toHaveCount(0);
});
