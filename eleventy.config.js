import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import markdownIt from "markdown-it";
import Image, { generateHTML } from "@11ty/eleventy-img";
import { researchCV } from "./scripts/research-cv.mjs";

// Widths that the image pipeline makes for each photo. The largest width
// serves high-resolution desktop screens; smaller ones serve phones.
const WIDTHS = {
  gallery: [640, 1024, 1600, 2400],
  hero: [800, 1280, 1920, 2560, 3200],
  card: [480, 800, 1200, 1600],
};

const IMAGE_OPTIONS = {
  formats: ["avif", "jpeg"],
  outputDir: "_site/img/",
  urlPath: "/img/",
  // Effort 2 keeps AVIF builds fast; the size gain of a higher effort is small.
  sharpAvifOptions: { quality: 55, effort: 2 },
  sharpJpegOptions: { quality: 80, mozjpeg: true, progressive: true },
  // Readable names: <original-name>-<hash>-<width>.<format>
  filenameFormat: (id, src, width, format) =>
    `${path.basename(src, path.extname(src))}-${id}-${width}.${format}`,
};

// Resolve an image path from front matter. A plain file name is relative to
// the folder of the page; a path that starts with "/" is relative to src/.
function resolveSrc(src, inputPath) {
  if (src.startsWith("/")) return path.join("src", src);
  return path.join(path.dirname(inputPath), src);
}

async function processImage(src, inputPath, kind = "gallery") {
  return Image(resolveSrc(src, inputPath), { ...IMAGE_OPTIONS, widths: WIDTHS[kind] });
}

function pictureHTML(metadata, alt, sizes, attrs = {}) {
  return generateHTML(metadata, {
    alt: alt ?? "",
    sizes,
    loading: "lazy",
    decoding: "async",
    ...attrs,
  });
}

function largest(metadata) {
  const jpeg = metadata.jpeg;
  return jpeg[jpeg.length - 1];
}

const md = markdownIt({ html: true, typographer: true, linkify: false });

export default function (eleventyConfig) {
  eleventyConfig.setLibrary("md", md);
  eleventyConfig.addDataExtension("yml,yaml", (contents) => YAML.parse(contents));

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addWatchTarget("src/assets/");

  eleventyConfig.addCollection("projects", (api) =>
    api
      .getFilteredByGlob("src/portfolio/*/index.md")
      .filter((p) => p.data.published !== false)
      .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99))
  );

  // Inline Markdown, for short strings in data files (for example the CV).
  eleventyConfig.addFilter("md", (str) => (str ? md.renderInline(String(str)) : ""));
  eleventyConfig.addFilter("researchCV", researchCV);
  eleventyConfig.addFilter("absoluteUrl", (url, base) => new URL(url, base).href);
  // Inline an SVG file from src/assets/img/, hidden from screen readers.
  eleventyConfig.addFilter("svg", (name) => {
    const file = path.join("src/assets/img", name);
    if (!fs.existsSync(file)) return "";
    return fs
      .readFileSync(file, "utf8")
      .replace(/<\?xml[^>]*>\s*/, "")
      .replace(/<title>.*?<\/title>/s, "")
      .replace(/\s(role|aria-label)="[^"]*"/g, "")
      .replace("<svg", '<svg aria-hidden="true" focusable="false"');
  });
  eleventyConfig.addFilter("year", () => new Date().getFullYear());

  // {% picture src, alt, sizes, kind, class, eager %}
  // A responsive <picture> with AVIF and JPEG in several widths.
  eleventyConfig.addAsyncShortcode(
    "picture",
    async function (src, alt, sizes = "100vw", kind = "gallery", className = "", eager = false) {
      const metadata = await processImage(src, this.page.inputPath, kind);
      const attrs = className ? { class: className } : {};
      if (eager) Object.assign(attrs, { loading: "eager", fetchpriority: "high" });
      return pictureHTML(metadata, alt, sizes, attrs);
    }
  );

  // {% cover project, sizes %} — the cover image of a project, cropped by CSS.
  eleventyConfig.addAsyncShortcode("cover", async function (project, sizes, eager = false) {
    const metadata = await processImage(project.data.cover, project.inputPath, "card");
    const attrs = eager ? { loading: "eager", fetchpriority: "high" } : {};
    return pictureHTML(metadata, project.data.cover_alt, sizes, attrs);
  });

  // {% hero project, index %} — one slide of the home page hero.
  eleventyConfig.addAsyncShortcode("hero", async function (project, index) {
    const metadata = await processImage(project.data.hero ?? project.data.cover, project.inputPath, "hero");
    const attrs = index === 0 ? { loading: "eager", fetchpriority: "high" } : {};
    // Desktop photographs span the content width; phones use a square frame.
    return pictureHTML(metadata, project.data.hero_alt ?? project.data.cover_alt, "(min-width: 64.5em) 984px, (min-width: 48em) calc(100vw - 48px), calc(100vw - 32px)", attrs);
  });

  // {% ogImage src, inputPath %} — URL path of a 1200 px JPEG for link previews.
  eleventyConfig.addAsyncShortcode("ogImage", async function (src, inputPath) {
    const metadata = await Image(resolveSrc(src, inputPath), {
      ...IMAGE_OPTIONS,
      widths: [1200],
      formats: ["jpeg"],
    });
    return metadata.jpeg[0].url;
  });

  // {% gallery gallery, page.inputPath %}
  // Landscape photos fill the width. Two portrait photos in sequence share a
  // row. Set `size: full` on a photo to stop it from being paired.
  eleventyConfig.addAsyncShortcode("gallery", async function (items, inputPath) {
    if (!items?.length) return "";
    const photos = await Promise.all(
      items.map(async (item, i) => {
        const metadata = await processImage(item.src, inputPath, "gallery");
        const { width, height } = largest(metadata);
        return { ...item, i, metadata, portrait: height > width };
      })
    );

    const rows = [];
    for (let i = 0; i < photos.length; i++) {
      const a = photos[i];
      const b = photos[i + 1];
      if (a.portrait && b?.portrait && a.size !== "full" && b.size !== "full") {
        rows.push([a, b]);
        i++;
      } else {
        rows.push([a]);
      }
    }

    const figure = (p, sizes) => {
      const full = largest(p.metadata);
      const img = pictureHTML(p.metadata, p.alt, sizes);
      const caption = p.caption ? `<figcaption>${md.renderInline(p.caption)}</figcaption>` : "";
      return `<figure class="gallery__item${p.portrait ? " is-portrait" : ""}">
  <a href="${full.url}" class="gallery__link" data-lightbox data-width="${full.width}" data-height="${full.height}">${img}</a>${caption}
</figure>`;
    };

    return `<div class="gallery">${rows
      .map((row) =>
        row.length === 2
          ? `<div class="gallery__row gallery__row--pair">${row
              .map((p) => figure(p, "(min-width: 48em) 46vw, 100vw"))
              .join("")}</div>`
          : `<div class="gallery__row">${figure(row[0], row[0].portrait ? "(min-width: 48em) 60vw, 100vw" : "(min-width: 112em) 1760px, 96vw")}</div>`
      )
      .join("\n")}</div>`;
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "liquid",
    templateFormats: ["md", "liquid", "html"],
  };
}
