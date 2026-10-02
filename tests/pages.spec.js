// Checks that run on every page, at every screen size.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { pages, loadAllImages, watchErrors } from "./site.js";

for (const url of pages) {
  test.describe(url, () => {
    test("loads without errors and has the SEO basics", async ({ page }) => {
      const errors = watchErrors(page);
      const response = await page.goto(url);
      expect(response.status()).toBe(200);
      await loadAllImages(page);

      await expect(page).toHaveTitle(/Marta Maçães Viana/);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /^.{50,300}$/s);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\/mrt-arch\.com\//);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /^https:\/\/mrt-arch\.com\/.+\.(jpe?g|png)$/);
      await expect(page.locator("h1")).toHaveCount(1);
      expect(errors).toEqual([]);
    });

    test("has no accessibility violations (WCAG 2.2 AA)", async ({ page }) => {
      await page.goto(url);
      await loadAllImages(page);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
        .analyze();
      const summary = results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length}×) ${v.nodes[0].target}`);
      expect(summary).toEqual([]);
    });

    test("does not scroll sideways", async ({ page }) => {
      await page.goto(url);
      await loadAllImages(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test("every image has alt text, loads, and is sharp enough", async ({ page }) => {
      await page.goto(url);
      await loadAllImages(page);
      const problems = await page.evaluate(() => {
        const out = [];
        const dpr = window.devicePixelRatio;
        for (const img of document.images) {
          if (img.closest("dialog")) continue; // the lightbox image is empty until it opens
          const name = img.currentSrc.split("/").pop();
          if (!img.hasAttribute("alt")) out.push(`no alt: ${name}`);
          else if (/^(P\d|IMG|DSC|image)/i.test(img.alt) || /\.(jpe?g|png|webp)/i.test(img.alt)) out.push(`alt is a file name: ${name}`);
          if (!img.complete || img.naturalWidth === 0) out.push(`not loaded: ${name}`);
          const shown = img.getBoundingClientRect().width;
          if (shown < 2) continue; // hidden (for example a slide that is not active)
          // The browser must pick a file at least as wide as the screen pixels,
          // unless no larger file exists. Read the file widths from srcset.
          const sets = img.parentElement.tagName === "PICTURE" ? img.parentElement.querySelectorAll("source, img") : [img];
          const candidates = [...sets]
            .flatMap((el) => (el.getAttribute("srcset") || "").split(","))
            .map((c) => c.trim().split(/\s+/))
            .filter(([u, w]) => u && /^\d+w$/.test(w ?? ""))
            .map(([u, w]) => ({ file: u.split("/").pop(), width: parseInt(w) }));
          const chosen = candidates.find((c) => c.file === name);
          const fileWidth = chosen ? chosen.width : img.naturalWidth;
          const largest = Math.max(fileWidth, ...candidates.filter((c) => c.file.split(".").pop() === name.split(".").pop()).map((c) => c.width));
          const needed = Math.min(shown * dpr, largest);
          if (fileWidth < needed * 0.85) out.push(`blurry: ${name} is ${fileWidth}px, shown at ${Math.round(shown * dpr)} device px`);
        }
        return out;
      });
      expect(problems).toEqual([]);
    });

    test("uses the Geograph font", async ({ page }) => {
      await page.goto(url);
      const ok = await page.evaluate(async () => {
        await document.fonts.ready;
        return document.fonts.check('16px "Geograph"');
      });
      expect(ok).toBe(true);
    });
  });
}
