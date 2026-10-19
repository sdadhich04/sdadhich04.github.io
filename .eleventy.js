import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import {
  chip, figure, cardVisual, toc, repoLabel, projectBody, pageBody, inlineCss, slugify,
} from "./lib/render.js";

const FONTS = {
  "node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2": "assets/fonts/inter-400.woff2",
  "node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2": "assets/fonts/inter-500.woff2",
  "node_modules/@fontsource/inter-tight/files/inter-tight-latin-700-normal.woff2": "assets/fonts/inter-tight-700.woff2",
  "node_modules/@fontsource/inter-tight/files/inter-tight-latin-800-normal.woff2": "assets/fonts/inter-tight-800.woff2",
  "node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2": "assets/fonts/jetbrains-mono-500.woff2",
};

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
    widths: [450, 900],
    urlPath: "/assets/img/r/",
    outputDir: "_site/assets/img/r/",
    defaultAttributes: { loading: "lazy", decoding: "async", sizes: "(min-width: 60rem) 30rem, 100vw" },
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
  eleventyConfig.addShortcode("cardVisual", cardVisual);
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
