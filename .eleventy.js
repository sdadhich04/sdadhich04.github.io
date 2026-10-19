import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import Image, { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import {
  chip, figure, toc, repoLabel, projectBody, pageBody, inlineCss, slugify, esc,
} from "./lib/render.js";

const FONTS = {
  "node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2": "assets/fonts/inter-400.woff2",
  "node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2": "assets/fonts/inter-500.woff2",
  "node_modules/@fontsource/big-shoulders-display/files/big-shoulders-display-latin-900-normal.woff2": "assets/fonts/big-shoulders-display-900.woff2",
  "node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2": "assets/fonts/jetbrains-mono-500.woff2",
};

// Home hero render: transparent PNG, art-directed (wide render from 48rem up, the squarer
// mobile render below), AVIF/WebP/PNG at several widths, loaded eagerly as the likely LCP image.
async function heroPicture(wideName, mobileName, alt) {
  const opts = (widths) => ({
    widths, formats: ["avif", "webp", "png"],
    urlPath: "/assets/img/r/", outputDir: "_site/assets/img/r/",
    sharpAvifOptions: { quality: 60 }, sharpWebpOptions: { quality: 80 },
  });
  const wide = await Image(`src/assets/img/${wideName}.png`, opts([640, 960, 1300, 1844]));
  const mob = mobileName ? await Image(`src/assets/img/${mobileName}.png`, opts([420, 824])) : null;
  const MOBILE = "(max-width: 47.99rem)";
  const wideSizes = "(min-width: 90rem) 69rem, (min-width: 48rem) 62vw, 100vw";   // matches the enlarged render (components.css)
  const srcset = (meta, fmt) => meta[fmt].map((m) => m.srcset).join(", ");
  const sources = [];
  for (const fmt of ["avif", "webp"]) {
    if (mob) sources.push(`<source type="image/${fmt}" media="${MOBILE}" srcset="${srcset(mob, fmt)}" sizes="80vw">`);
    sources.push(`<source type="image/${fmt}" srcset="${srcset(wide, fmt)}" sizes="${wideSizes}">`);
  }
  if (mob) sources.push(`<source type="image/png" media="${MOBILE}" srcset="${srcset(mob, "png")}" sizes="80vw">`);
  const fb = wide.png[1] || wide.png[0];
  return `<picture>${sources.join("")}<img src="${fb.url}" srcset="${srcset(wide, "png")}" sizes="${wideSizes}" width="${fb.width}" height="${fb.height}" alt="${esc(alt)}" fetchpriority="high" decoding="async" eleventy:ignore></picture>`;
}

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets/svg");
  eleventyConfig.addPassthroughCopy("src/assets/pdf");
  eleventyConfig.addPassthroughCopy("src/assets/js");
  eleventyConfig.addPassthroughCopy("src/assets/css");
  eleventyConfig.addPassthroughCopy("src/assets/img/og.png");
  eleventyConfig.addPassthroughCopy("src/resume*.pdf");
  eleventyConfig.addPassthroughCopy(FONTS);
  eleventyConfig.addWatchTarget("src/assets/css/");
  eleventyConfig.addWatchTarget("lib/");

  const md = markdownIt({ html: true, linkify: false, typographer: false }).use(markdownItAnchor, {
    level: [2, 3],
    slugify,
    tabIndex: false,
  });
  eleventyConfig.setLibrary("md", md);

  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["avif", "webp", "auto"],
    widths: [450, 900, 1400],
    urlPath: "/assets/img/r/",
    outputDir: "_site/assets/img/r/",
    defaultAttributes: { loading: "lazy", decoding: "async", sizes: "(min-width: 72rem) 36rem, (min-width: 52rem) 50vw, 100vw" },
  });

  eleventyConfig.addFilter("chip", chip);
  eleventyConfig.addFilter("toc", toc);
  eleventyConfig.addFilter("repoLabel", repoLabel);
  eleventyConfig.addFilter("projectBody", projectBody);
  eleventyConfig.addFilter("pageBody", pageBody);
  eleventyConfig.addFilter("md", (s) => md.render(String(s ?? "")));
  eleventyConfig.addFilter("mdInline", (s) => md.renderInline(String(s ?? "")));
  eleventyConfig.addFilter("upper", (s) => String(s ?? "").toUpperCase());
  eleventyConfig.addFilter("nextAfter", (items, url) => {
    const i = items.findIndex((p) => p.url === url);
    return i < 0 ? null : items[(i + 1) % items.length];
  });
  eleventyConfig.addShortcode("figure", (id, caption, eager) => figure(id, { caption: caption || undefined, eager: !!eager }));
  eleventyConfig.addAsyncShortcode("heroPicture", heroPicture);
  eleventyConfig.addGlobalData("inlineCss", () => inlineCss());
  eleventyConfig.addGlobalData("buildYear", () => new Date().getFullYear());

  eleventyConfig.addCollection("project", (api) =>
    api.getFilteredByTag("project").sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99)));

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["md", "njk"],
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
  };
}
