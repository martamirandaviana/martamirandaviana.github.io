// The site must also work when JavaScript is off or fails to load.
import { test, expect } from "@playwright/test";
import { projects } from "./site.js";

test.use({ javaScriptEnabled: false });

test("the menu links are visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".site-nav").getByRole("link", { name: "Portfolio" })).toBeVisible();
});

test("the home page shows the first project", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".hero__slide").first()).toBeVisible();
  await expect(page.locator(".hero__toggle")).toBeHidden();
});

test("a gallery photo links to the large image", async ({ page }) => {
  await page.goto(projects[0].url);
  const href = await page.locator(".gallery__link").first().getAttribute("href");
  const response = await page.request.get(href);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/jpeg");
});
