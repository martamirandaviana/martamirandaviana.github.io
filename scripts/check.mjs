// Check the built site: valid HTML, and no broken internal links or images.
//   npm run check            (builds first)
//   npm run check -- --no-build
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

if (!process.argv.includes("--no-build")) {
  execSync("npx @11ty/eleventy --quiet", { stdio: "inherit" });
}

let failed = false;

console.log("Validating HTML…");
try {
  execSync('npx html-validate "_site/**/*.html"', { stdio: "inherit" });
} catch {
  failed = true;
}

console.log("Checking internal links and images…");
const files = fs.readdirSync("_site", { recursive: true }).filter((f) => f.endsWith(".html"));
const broken = [];
for (const file of files) {
  const html = fs.readFileSync(path.join("_site", file), "utf8");
  const refs = [...html.matchAll(/(?:href|src)="(\/[^"#?]*)/g), ...html.matchAll(/srcset="([^"]+)"/g)]
    .flatMap((m) => (m[0].startsWith("srcset") ? m[1].split(",").map((s) => s.trim().split(" ")[0]) : [m[1]]))
    .filter((r) => r.startsWith("/") && !r.startsWith("//"));
  for (const ref of new Set(refs)) {
    let target = path.join("_site", decodeURIComponent(ref));
    if (ref.endsWith("/")) target = path.join(target, "index.html");
    if (!fs.existsSync(target)) broken.push(`${file}: ${ref}`);
  }
}
if (broken.length) {
  failed = true;
  console.log("Broken references:\n  " + broken.join("\n  "));
} else {
  console.log(`No broken references in ${files.length} pages.`);
}

process.exit(failed ? 1 : 0);
