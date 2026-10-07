import { test, expect } from "@playwright/test";
import sharp from "sharp";

test("shared homepage uses a large logo on pure white", async ({ page, request }) => {
  await page.goto("/");
  const imageUrl = await page.locator('meta[property="og:image"]').getAttribute("content");
  const response = await request.get(new URL(imageUrl).pathname);
  expect(response.ok()).toBe(true);
  const bytes = await response.body();
  const metadata = await sharp(bytes).metadata();
  expect(metadata.format).toBe("png");
  expect(metadata.width).toBe(1200);
  expect(metadata.height).toBe(1200);
  const { data, info } = await sharp(bytes).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  for (const [x, y] of [[0, 0], [1199, 0], [0, 1199], [1199, 1199]]) {
    const offset = (y * info.width + x) * info.channels;
    expect([...data.subarray(offset, offset + 3)]).toEqual([255, 255, 255]);
  }
  const darkColumns = [];
  for (let x = 0; x < info.width; x++) {
    for (let y = 0; y < info.height; y++) {
      if (data[(y * info.width + x) * info.channels] < 80) {
        darkColumns.push(x);
        break;
      }
    }
  }
  expect(Math.max(...darkColumns) - Math.min(...darkColumns)).toBeGreaterThan(850);
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", imageUrl);
});

test("Sea House portfolio cover and opening carousel use the staircase photo", async ({ page }) => {
  await page.goto("/portfolio/");
  const card = page.locator('.card__link[href="/portfolio/sea-house/"]');
  const image = card.locator("img");
  await expect(image).toHaveAttribute("src", /P5_02-/);
  const frame = await card.locator(".card__media").boundingBox();
  const photo = await image.boundingBox();
  expect(Math.abs(frame.height - photo.height)).toBeLessThan(1);
  await page.goto("/");
  await expect(page.locator('.hero__media[href="/portfolio/sea-house/"] img')).toHaveAttribute("src", /P5_02-/);
});
