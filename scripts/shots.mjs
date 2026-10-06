// Render screenshots of the website, to review a change before it is published.
//
//   npm run shots                       all pages, all screen sizes
//   npm run shots -- --only=sea-house   only pages whose URL contains "sea-house"
//   npm run shots -- --sizes=phone      only one screen size (phone, laptop, desktop)
//   npm run shots -- --fold             only the first screen, not the full page
//   npm run shots -- --no-build         use the existing _site/ folder
//
// The images go to screenshots/<size>/<page>.png. Git ignores this folder.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { serve } from "./serve.mjs";

const SIZES = {
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  laptop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  desktop: { viewport: { width: 2560, height: 1440 }, deviceScaleFactor: 1 },
};

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

if (!args["no-build"]) {
  console.log("Building the site…");
  execSync("npx @11ty/eleventy --quiet", { stdio: "inherit" });
}

const sitemap = fs.readFileSync("_site/sitemap.xml", "utf8");
let pages = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map((m) => m[1]);
pages.push("/404.html");
if (args.only) pages = pages.filter((p) => p.includes(args.only));

const sizes = args.sizes ? String(args.sizes).split(",") : Object.keys(SIZES);
const outDir = "screenshots";
fs.rmSync(outDir, { recursive: true, force: true });

const { server, url } = await serve();
const browser = await chromium.launch();
const written = [];

try {
  for (const size of sizes) {
    const context = await browser.newContext({ ...SIZES[size], reducedMotion: "reduce" });
    const page = await context.newPage();
    fs.mkdirSync(path.join(outDir, size), { recursive: true });

    for (const p of pages) {
      await page.goto(url + p, { waitUntil: "load" });
      // Load every lazy image, then wait until all images are decoded.
      await page.evaluate(async () => {
        document.querySelectorAll('img[loading="lazy"]').forEach((img) => (img.loading = "eager"));
        await document.fonts.ready;
        await Promise.all([...document.images].map((img) => img.decode().catch(() => {})));
      });
      // Give the browser time to paint large images before the capture.
      await page.waitForTimeout(400);
      const name = p === "/" ? "home" : p.replace(/^\/|\/$/g, "").replace(/\//g, "__").replace(/\.html$/, "");
      const file = path.join(outDir, size, `${name}.png`);
      await page.screenshot({ path: file, fullPage: !args.fold });
      written.push(file);
    }
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}

console.log(`\n${written.length} screenshots:`);
for (const f of written) console.log("  " + f);
