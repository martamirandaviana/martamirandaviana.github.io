import { test, expect } from "@playwright/test";
import sharp from "sharp";
import { projects } from "./site.js";

test("site icons have opaque white backgrounds, including the SVG", async ({ page, request }) => {
  await page.goto("/");
  const icons = await page.locator('link[rel="icon"], link[rel="apple-touch-icon"]').evaluateAll(links =>
    links.map(link => ({ href: link.getAttribute("href"), type: link.getAttribute("type") }))
  );
  expect(icons.some(icon => icon.type === "image/svg+xml")).toBe(true);
  for (const icon of icons) {
    const response = await request.get(icon.href);
    expect(response.ok()).toBe(true);
    const { data, info } = await sharp(await response.body()).resize(128, 128).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (const [x, y] of [[0, 0], [127, 0], [0, 127], [127, 127]]) {
      const offset = (y * info.width + x) * info.channels;
      expect([...data.subarray(offset, offset + 4)], icon.href).toEqual([255, 255, 255, 255]);
    }
  }
});

test("current menu underlines sit close to the words without overlapping another link", async ({ page, isMobile }) => {
  for (const url of ["/portfolio/", "/research/", "/about/", "/contact/"]) {
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    if (isMobile) await page.locator(".menu-toggle").click();
    const link = page.locator('.site-nav a[aria-current="page"]');
    const normal = await sharp(await link.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    await link.evaluate(el => { el.style.background = "none"; el.style.textDecoration = "none"; });
    const plain = await sharp(await link.screenshot()).removeAlpha().raw().toBuffer();
    let lastTextRow = -1;
    const underlineRows = [];
    for (let y = 0; y < normal.info.height; y++) {
      let changed = 0;
      for (let x = 0; x < normal.info.width; x++) {
        const i = (y * normal.info.width + x) * normal.info.channels;
        if (plain[i] < 120) lastTextRow = y;
        if (normal.data[i] + 30 < plain[i]) changed++;
      }
      if (changed > normal.info.width * 0.65) underlineRows.push(y);
    }
    expect(underlineRows.length, url).toBeGreaterThan(0);
    const fontSize = await link.evaluate(el => parseFloat(getComputedStyle(el).fontSize));
    const scale = normal.info.width / (await link.boundingBox()).width;
    const gap = (Math.min(...underlineRows) - lastTextRow) / scale;
    expect(gap, url).toBeGreaterThan(0);
    expect(gap, url).toBeLessThanOrEqual(fontSize * 0.35);
  }
});

test("phone project text stays justified without excessively wide word gaps", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Narrow columns need the extra word breaks");
  for (const project of projects) {
    await page.goto(project.url);
    await page.evaluate(() => document.fonts.ready);
    const paragraphs = await page.locator(".project-text p").evaluateAll(ps => ps.map(p => {
      const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
      const gaps = [];
      let node;
      while ((node = walker.nextNode())) {
        for (let i = 0; i < node.length; i++) {
          if (node.data[i] !== " ") continue;
          const range = document.createRange();
          range.setStart(node, i);
          range.setEnd(node, i + 1);
          gaps.push(range.getBoundingClientRect().width);
        }
      }
      return { align: getComputedStyle(p).textAlign, font: parseFloat(getComputedStyle(p).fontSize), maxGap: Math.max(...gaps) };
    }));
    for (const paragraph of paragraphs) {
      expect(paragraph.align, project.url).toBe("justify");
      expect(paragraph.maxGap, project.url).toBeLessThanOrEqual(paragraph.font * 0.9);
    }
  }
});
