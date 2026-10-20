// Build-time helpers: chips, figures and the HTML post-processing that turns rendered
// Markdown into the components in DESIGN-SYSTEM.md (decision blocks, sections, cards).
import fs from "node:fs";
import path from "node:path";
import { parse } from "node-html-parser";

const MEDIA_FILE = path.resolve("src/_data/media.json");

export const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function slugify(s) {
  return String(s)
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const STATUS = /^(completed|prototype|validated|published|presented|in preparation|under review)$/i;

export function chip(text, kind) {
  const t = String(text ?? "").trim();
  if (!t) return "";
  if (/^●\s*active$/i.test(t))
    return `<span class="chip chip--active"><span class="chip__dot" aria-hidden="true">●</span>Active</span>`;
  if (kind === "status" || STATUS.test(t)) return `<span class="chip chip--status">${esc(t)}</span>`;
  return `<span class="chip chip--context">${esc(t)}</span>`;
}

function loadMedia() {
  return JSON.parse(fs.readFileSync(MEDIA_FILE, "utf8"));
}

export function mediaItem(id) {
  return loadMedia().items[id];
}

// <figure> for a plot, diagram or art SVG. Plots and diagrams scroll sideways under 640 px
// (DESIGN-SYSTEM "Plots"), so their scroll box is focusable for keyboard users.
export function figure(id, { caption, eager = false, cls = "" } = {}) {
  const m = mediaItem(id);
  if (!m) return "";
  const scrolls = m.kind === "plot" || m.kind === "diagram";
  const alt = m.desc ? `${m.title}. ${m.desc}` : m.title;
  const img = `<img src="${m.src}" width="${m.width}" height="${m.height}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" eleventy:ignore>`;
  const body = scrolls
    ? `<div class="fig__scroll" tabindex="0" role="region" aria-label="${esc(m.title)} (scrolls sideways on small screens)">${img}</div>`
    : img;
  const cap = caption ?? m.caption;
  const capHtml = `<figcaption><span class="fig__title">${esc(m.title)}</span>${cap ? ` <span class="fig__method">${esc(cap)}</span>` : ""}</figcaption>`;
  let table = "";
  if (m.table) {
    const head = m.table.headers.map((h) => `<th scope="col">${esc(h)}</th>`).join("");
    const rows = m.table.rows.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${esc(c)}</th>` : `<td>${esc(c)}</td>`)).join("")}</tr>`).join("");
    table = `<details class="fig__data"><summary>Data table</summary><div class="table-scroll" tabindex="0" role="region" aria-label="${esc(m.title)}: data table"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div></details>`;
  }
  return `<figure class="fig fig--${m.kind} ${cls}">${body}${capHtml}${table}</figure>`;
}

export function toc(html) {
  return [...String(html).matchAll(/<h2 id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => ({
    id: m[1],
    text: parse(m[2]).text.trim(), // decoded text; the template escapes it once
  }));
}

export function repoLabel(url) {
  const m = String(url).match(/github\.com\/([^/]+\/[^/#?]+)/);
  return m ? `${m[1]} on GitHub` : url;
}

// ----------------------------------------------------------------- shared DOM passes

function codeChips(root) {
  for (const code of root.querySelectorAll("code")) {
    const t = code.text.trim();
    if (/^●\s*active$/i.test(t) || STATUS.test(t)) code.replaceWith(parse(chip(t)));
  }
  // "**● Active**" in prose gets the same green status chip (dot and word in --active)
  for (const strong of root.querySelectorAll("strong")) {
    if (/^●\s*active$/i.test(strong.text.trim())) strong.replaceWith(parse(chip(strong.text)));
  }
}

function wrapTables(root) {
  for (const table of root.querySelectorAll("table")) {
    if (table.parentNode?.classList?.contains("table-scroll")) continue;
    const wrap = parse(`<div class="table-scroll" tabindex="0" role="region" aria-label="Table"></div>`).firstChild;
    table.replaceWith(wrap);
    wrap.appendChild(table);
  }
}

// <p><img src="….svg"></p><p>caption</p>  ->  <figure class="fig fig--art">
function artFigures(root) {
  const items = loadMedia().items;
  for (const img of root.querySelectorAll("p > img")) {
    const p = img.parentNode;
    const src = img.getAttribute("src") || "";
    const id = path.basename(src).replace(/\.svg$/, "");
    if (!src.endsWith(".svg") || !items[id]) continue;
    const m = items[id];
    img.setAttribute("width", String(m.width));
    img.setAttribute("height", String(m.height));
    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");
    img.setAttribute("eleventy:ignore", "");
    let next = p.nextElementSibling;
    const cap = next && next.tagName === "P" && !next.querySelector("img") ? next : null;
    const fig = parse(`<figure class="fig fig--art fig--${id}">${img.toString()}${cap ? `<figcaption>${cap.innerHTML}</figcaption>` : ""}</figure>`).firstChild;
    p.replaceWith(fig);
    if (cap) cap.remove();
  }
}

// A paragraph that is only "Figure: <media id>" becomes that plot or diagram's full <figure>
// (scroll box, caption, data table). sync-content.mjs refuses ids that aren't ✅ ready.
function inlineFigures(root) {
  for (const p of root.querySelectorAll("p")) {
    const m = p.text.trim().match(/^Figure:\s*([a-z0-9-]+)$/);
    if (m && mediaItem(m[1])) p.replaceWith(figure(m[1]));
  }
}

// Paragraphs written one item per line (education, citations) keep their line breaks.
function lineBreaks(root) {
  for (const p of root.querySelectorAll("p")) {
    const html = p.innerHTML;
    if (!html.includes("\n")) continue;
    const lines = html.split("\n").map((l) => l.replace(/<[^>]+>/g, "").trim());
    if (lines.some((l) => /[.!?:]$/.test(l))) continue;
    p.set_content(html.split("\n").join("<br>"));
  }
}

// Wrap each h2 and what follows it in <section> so sections can be styled and labelled.
function sectionize(root) {
  let out = "", open = false;
  for (const node of root.childNodes) {
    if (node.tagName === "H2") {
      if (open) out += "</section>";
      const id = node.getAttribute("id");
      out += `<section class="sec sec--${id}" aria-labelledby="${id}">`;
      open = true;
    }
    out += node.toString();
  }
  if (open) out += "</section>";
  return out;
}

// ----------------------------------------------------------------- project pages

const DECISION_LABELS = ["Criteria", "Options", "Pick", "Limitations"];

const firstNonBlank = (el) => el.childNodes.find((n) => !(n.nodeType === 3 && !n.text.trim()));

function leadingStrong(li) {
  const first = firstNonBlank(li);
  if (first && first.tagName === "P") {
    const inner = firstNonBlank(first);
    if (inner && inner.tagName === "STRONG") return inner;
  }
  return first && first.tagName === "STRONG" ? first : null;
}

function decisionBlocks(root) {
  for (const ul of root.querySelectorAll("ul")) {
    const items = ul.childNodes.filter((n) => n.tagName === "LI");
    const labels = items.map((li) => leadingStrong(li)?.text.replace(/:$/, "").replace(/\s*\(.*\)$/, "").trim());
    if (!items.length || labels[0] !== "Criteria" || !labels.every((l) => DECISION_LABELS.includes(l))) continue;
    const rows = items.map((li, i) => {
      const strong = leadingStrong(li);
      const qualifier = strong.text.replace(/:$/, "").match(/\((.*)\)$/);
      strong.remove();
      let html = li.innerHTML.trim();
      if (html.startsWith("<p>")) html = html.replace(/^<p>\s*/, "<p>");
      return `<div class="decision__row decision__row--${labels[i].toLowerCase()}"><dt>${labels[i]}${qualifier ? ` <span class="decision__q">(${esc(qualifier[1])})</span>` : ""}</dt><dd>${html}</dd></div>`;
    });
    // Block marker (DESIGN-SYSTEM v2): the decision heading and its rows share one red left edge.
    const prev = ul.previousElementSibling;
    const head = prev && prev.tagName === "H3" ? prev : null;
    ul.replaceWith(parse(`<div class="decision-block">${head ? head.toString() : ""}<dl class="decision">${rows.join("")}</dl></div>`));
    if (head) head.remove();
  }
}

export function projectBody(html, plotId) {
  const root = parse(String(html));
  decisionBlocks(root);
  codeChips(root);
  wrapTables(root);
  artFigures(root);
  inlineFigures(root);
  for (const bq of root.querySelectorAll("blockquote")) bq.classList.add("note");
  if (plotId) {
    const results = root.querySelector("h2#results");
    if (results) results.insertAdjacentHTML("afterend", figure(plotId, { cls: "fig--results" }));
  }
  return sectionize(root);
}

// ----------------------------------------------------------------- plain pages

// Coursework (R26): under "## Coursework", each "### Group" heading is followed by a two-column
// table (Course | Pathway). The first group (ECE major) fills the left column; the other groups
// (NC&E minor, math & science) stack in the right column. An empty pathway cell shows no tag.
function coursework(root) {
  const h = root.querySelector("h2#coursework");
  if (!h) return;
  const groups = [], consumed = [];
  let el = h.nextElementSibling, cur = null;
  while (el && el.tagName !== "H2") {
    if (el.tagName === "H3") {
      cur = { title: el.text.trim(), id: el.getAttribute("id"), rows: [] };
      groups.push(cur); consumed.push(el);
    } else if (el.tagName === "TABLE" && cur) {
      for (const tr of el.querySelectorAll("tbody tr")) {
        const [course, tag = ""] = tr.querySelectorAll("td").map((c) => c.text.trim());
        const m = course.match(/^([A-Z]+ \d{3}(?:\/\d{3})?)\s+(.*)$/);
        cur.rows.push({ code: m ? m[1] : "", title: m ? m[2] : course, tag });
      }
      consumed.push(el);
    }
    el = el.nextElementSibling;
  }
  if (!groups.length) return;
  const list = (items) => items.map((c) =>
    `<li><span class="cw__code">${esc(c.code)}</span><span class="cw__title">${esc(c.title)}</span>${c.tag ? `<span class="cw__tag">${esc(c.tag)}</span>` : ""}</li>`).join("");
  const group = (g) => `<section class="cw-group" aria-labelledby="${g.id}"><h3 id="${g.id}">${esc(g.title)}</h3><ul>${list(g.rows)}</ul></section>`;
  const htmlOut = `<div class="coursework"><div class="cw-col">${group(groups[0])}</div><div class="cw-col">${groups.slice(1).map(group).join("")}</div></div>`;
  consumed[0].replaceWith(parse(htmlOut));
  for (const c of consumed.slice(1)) c.remove();
}

function pubCards(root) {
  for (const h3 of root.querySelectorAll("h3")) {
    const parts = [h3];
    let el = h3.nextElementSibling;
    while (el && !["H2", "H3", "HR"].includes(el.tagName)) { parts.push(el); el = el.nextElementSibling; }
    const thumbP = parts.find((p) => p.tagName === "P" && p.querySelector("img") && p.text.trim() === "");
    for (const a of parts.flatMap((p) => p.querySelectorAll("a"))) {
      if (/\.pdf$/i.test(a.getAttribute("href") || "")) a.classList.add("btn", "btn--secondary");
    }
    const ordered = [thumbP, ...parts.filter((p) => p !== thumbP)].filter(Boolean);
    const card = parse(`<article class="pubcard">${thumbP ? `<div class="pubcard__thumb">${thumbP.innerHTML}</div>` : ""}<div class="pubcard__body">${ordered.filter((p) => p !== thumbP).map((p) => p.toString()).join("")}</div></article>`).firstChild;
    h3.replaceWith(card);
    for (const p of parts.slice(1)) p.remove();
  }
}

// Plain pages: the title and intro, then one <section> per h2 with a heading column and a body
// column, so About and Interests can set headings beside their text instead of above it.
function pageSections(root) {
  let out = "", open = false, intro = false;
  for (const node of root.childNodes) {
    if (node.tagName === "H2") {
      if (intro) { out += "</div>"; intro = false; }
      if (open) out += "</div></section>";
      const id = node.getAttribute("id");
      out += `<section class="psec psec--${id}" aria-labelledby="${id}"><div class="psec__head">${node.toString()}</div><div class="psec__body">`;
      open = true;
      continue;
    }
    if (!open && !intro && node.tagName && node.tagName !== "H1") { out += `<div class="page__intro">`; intro = true; }
    out += node.toString();
  }
  if (intro) out += "</div>";
  if (open) out += "</div></section>";
  return out;
}

export function pageBody(html, pageClass) {
  const root = parse(String(html));
  codeChips(root);
  if (pageClass === "page-about" || pageClass === "page-publications") lineBreaks(root);
  if (pageClass === "page-about") coursework(root);
  if (pageClass === "page-publications") pubCards(root);
  wrapTables(root);
  artFigures(root);
  return pageSections(root);
}

export function inlineCss() {
  return ["tokens.css", "base.css", "components.css"]
    .map((f) => fs.readFileSync(path.resolve("src/assets/css", f), "utf8"))
    .join("\n")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n+/g, "\n")
    .trim();
}
