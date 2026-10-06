// Shared helpers for the tests: the list of pages, read from src/.
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const projectDirs = fs
  .readdirSync("src/portfolio", { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join("src/portfolio", d.name, "index.md")));

export const projects = projectDirs
  .map((d) => {
    const text = fs.readFileSync(path.join("src/portfolio", d.name, "index.md"), "utf8");
    const data = YAML.parse(text.split(/^---$/m)[1]);
    return { slug: d.name, url: `/portfolio/${d.name}/`, ...data };
  })
  .filter((p) => p.published !== false);

export const pages = ["/", "/portfolio/", "/about/", "/contact/", ...projects.map((p) => p.url)];

export const site = YAML.parse(fs.readFileSync("src/_data/site.yml", "utf8"));
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
// Matches an absolute URL on this site, for example https://<site>/portfolio/.
export const siteUrlPattern = (rest = "") => new RegExp(`^${escape(site.url)}/${rest}`);

export const redirects = YAML.parse(fs.readFileSync("src/_data/redirects.yml", "utf8"));

// Load every lazy image and wait until all images are decoded.
export async function loadAllImages(page) {
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => (img.loading = "eager"));
    await Promise.all([...document.images].map((img) => img.decode().catch(() => {})));
  });
}

// Collect JavaScript errors and failed requests during a test.
export function watchErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(`JS error: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`Console: ${m.text()}`));
  page.on("response", (r) => r.status() >= 400 && errors.push(`HTTP ${r.status()}: ${r.url()}`));
  return errors;
}
