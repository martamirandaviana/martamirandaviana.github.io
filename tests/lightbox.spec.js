// The image viewer on project pages.
import { test, expect } from "@playwright/test";
import { projects } from "./site.js";

const project = projects.find((p) => p.gallery?.length >= 3);

test("opens, moves with the arrow keys, and closes with Escape", async ({ page, isMobile }) => {
  await page.goto(project.url);
  const dialog = page.locator("dialog.lightbox");
  const second = page.locator(".gallery__link").nth(1);
  await second.click();
  await expect(dialog).toBeVisible();
  await expect(page.locator(".lightbox__count")).toHaveText(`2 / ${project.gallery.length}`);
  await expect(page.locator(".lightbox__img")).toHaveAttribute("alt", project.gallery[1].alt);

  if (!isMobile) {
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".lightbox__count")).toHaveText(`3 / ${project.gallery.length}`);
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator(".lightbox__count")).toHaveText(`1 / ${project.gallery.length}`);
    await expect(page.locator(".lightbox__prev")).toBeDisabled();
    await page.keyboard.press("Escape");
  } else {
    await page.locator(".lightbox__next").click();
    await expect(page.locator(".lightbox__count")).toHaveText(`3 / ${project.gallery.length}`);
    await page.locator(".lightbox__close").click();
  }
  await expect(dialog).toBeHidden();
  await expect(second).toBeFocused();
});

test("the large image loads", async ({ page }) => {
  await page.goto(project.url);
  await page.locator(".gallery__link").first().click();
  const img = page.locator(".lightbox__img");
  await expect(img).toHaveAttribute("src", /-\d+\.jpeg$/);
  await expect.poll(() => img.evaluate((i) => i.complete && i.naturalWidth)).toBeGreaterThan(1000);
});

test("the page behind does not scroll while the viewer is open", async ({ page }) => {
  await page.goto(project.url);
  await page.locator(".gallery__link").first().click();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await page.keyboard.press("Escape");
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});
