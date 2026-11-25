"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/react.tsx
var react_exports = {};
__export(react_exports, {
  CiteThis: () => CiteThis,
  FIGURE_HEIGHT: () => FIGURE_HEIGHT,
  FIGURE_WIDTH: () => FIGURE_WIDTH,
  PostBody: () => PostBody,
  decodeEntities: () => decodeEntities
});
module.exports = __toCommonJS(react_exports);
var import_react = require("react");
var import_marked = require("marked");

// src/cite.ts
var CITE_LABELS = {
  image: "Use this image",
  table: "Cite this table",
  article: "Cite or link to this article",
  link: "Link (HTML)",
  citation: "Citation",
  source: "Source"
};
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(text) {
  return escapeHtml(text).replace(/"/g, "&quot;");
}
function absoluteUrl(href, base) {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}
function anchorUrl(cite, anchor) {
  return `${cite.url.replace(/#.*$/, "")}#${anchor}`;
}
var figureId = (n) => `figure-${n}`;
var tableId = (n) => `table-${n}`;
function citeLabels(cite) {
  return { ...CITE_LABELS, ...cite.labels };
}
function credit(cite, href) {
  const labels = citeLabels(cite);
  return `${escapeHtml(labels.source)}: <a href="${escapeAttr(href)}">${escapeHtml(cite.title)}</a> \u2014 ${escapeHtml(cite.site)}`;
}
function imageEmbed(cite, image) {
  const href = anchorUrl(cite, figureId(image.n));
  const src = absoluteUrl(image.src, cite.url);
  return `<a href="${escapeAttr(href)}"><img src="${escapeAttr(src)}" alt="${escapeAttr(image.alt)}" width="768" loading="lazy"></a><br>${credit(cite, href)}`;
}
function tableCredit(cite, n) {
  return credit(cite, anchorUrl(cite, tableId(n)));
}
function articleLink(cite) {
  return `<a href="${escapeAttr(cite.url)}">${escapeHtml(cite.title)}</a>`;
}
function citeDate(date, locale = "en-US") {
  const m = date?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const at = new Date(Date.UTC(year, month - 1, day));
  if (at.getUTCMonth() !== month - 1 || at.getUTCDate() !== day) return null;
  const opts = { month: "long", day: "numeric", timeZone: "UTC" };
  let dayMonth;
  try {
    dayMonth = new Intl.DateTimeFormat(locale, opts).format(at);
  } catch {
    dayMonth = new Intl.DateTimeFormat("en-US", opts).format(at);
  }
  return `${m[1]}, ${dayMonth}`;
}
function citation(cite) {
  const author = cite.author?.trim() || cite.site;
  const when = citeDate(cite.date, cite.locale) ?? "n.d.";
  const site = author === cite.site ? "" : ` ${cite.site}.`;
  const title = /[.?!]$/.test(cite.title.trim()) ? cite.title.trim() : `${cite.title.trim()}.`;
  return `${author}. (${when}). ${title}${site} ${cite.url}`;
}

// src/react.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var FIGURE_WIDTH = 1536;
var FIGURE_HEIGHT = 1024;
var VIDEO = /\.(mp4|webm)(?:[?#]|$)/i;
var ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\xA0",
  mdash: "\u2014",
  ndash: "\u2013",
  hellip: "\u2026",
  lsquo: "\u2018",
  rsquo: "\u2019",
  ldquo: "\u201C",
  rdquo: "\u201D"
};
function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] !== "#") return ENTITIES[entity.toLowerCase()] ?? match;
    const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
    return code > 0 && code <= 1114111 ? String.fromCodePoint(code) : match;
  });
}
var isExternal = (href) => /^https?:\/\//i.test(href);
var defaults = {
  Image: ({ src, alt, width, height, sizes, className }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src, alt, width, height, sizes, className, loading: "lazy", decoding: "async" }),
  Link: ({ href, className, children }) => isExternal(href) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href, className, target: "_blank", rel: "noopener noreferrer", children }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href, className, children }),
  Video: ({ src, label, width, height, className }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", { src, "aria-label": label, width, height, className, muted: true, loop: true, autoPlay: true, playsInline: true }),
  Reveal: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children })
};
function inline(tokens, x) {
  return tokens?.map((token, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Fragment, { children: inlineToken(token, x) }, i));
}
function inlineToken(token, x) {
  switch (token.type) {
    case "text":
      return "tokens" in token && token.tokens ? inline(token.tokens, x) : decodeEntities(token.text);
    case "escape":
      return token.text;
    case "strong":
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { className: x.t.strong, children: inline(token.tokens, x) });
    case "em":
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: inline(token.tokens, x) });
    case "del":
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("del", { children: inline(token.tokens, x) });
    case "codespan":
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { className: x.t.code, children: decodeEntities(token.text) });
    case "br":
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {});
    case "link":
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(x.c.Link, { href: token.href, className: x.t.link, children: inline(token.tokens, x) });
    case "image":
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        x.c.Image,
        {
          src: token.href,
          alt: decodeEntities(token.text),
          width: FIGURE_WIDTH,
          height: FIGURE_HEIGHT,
          sizes: x.sizes,
          className: x.t.media
        }
      );
    default:
      return null;
  }
}
function figureImage(tokens) {
  const content = tokens.filter((t) => !(t.type === "text" && !t.text.trim()));
  return content.length === 1 && content[0].type === "image" ? content[0] : null;
}
function numberBlocks(tokens, nums, count = { figure: 0, table: 0 }) {
  for (const token of tokens) {
    if (token.type === "paragraph" && figureImage(token.tokens ?? [])) nums.set(token, ++count.figure);
    else if (token.type === "table") nums.set(token, ++count.table);
    else if (token.type === "blockquote") numberBlocks(token.tokens ?? [], nums, count);
    else if (token.type === "list") for (const item of token.items) numberBlocks(item.tokens ?? [], nums, count);
  }
  return nums;
}
var SNIPPET = { whiteSpace: "pre-wrap", wordBreak: "break-all", userSelect: "all" };
function Snippet({ code, t }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", { className: t.embedCode, style: SNIPPET, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: code }) });
}
function Embed({ label, code, t }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", { className: t.embed, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", { className: t.embedSummary, children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Snippet, { code, t })
  ] });
}
function CiteThis({ cite, theme }) {
  const t = theme ?? {};
  const labels = citeLabels(cite);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", { "aria-label": labels.article, className: t.cite, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", { className: t.embed, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", { className: t.embedSummary, children: labels.article }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: t.citeLabel, children: labels.link }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Snippet, { code: articleLink(cite), t }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: t.citeLabel, children: labels.citation }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Snippet, { code: citation(cite), t })
  ] }) });
}
function Figure({ image, n, x }) {
  const alt = decodeEntities(image.text);
  const caption = image.title ? decodeEntities(image.title.trim()) : "";
  const video = VIDEO.test(image.href);
  const embed = x.cite && n && !video ? imageEmbed(x.cite, { src: image.href, alt, n }) : null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(x.c.Reveal, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", { id: x.cite && n ? figureId(n) : void 0, className: x.t.figure, children: [
      video ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(x.c.Video, { src: image.href, label: alt, width: FIGURE_WIDTH, height: FIGURE_HEIGHT, className: x.t.media }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(x.c.Image, { src: image.href, alt, width: FIGURE_WIDTH, height: FIGURE_HEIGHT, sizes: x.sizes, className: x.t.media }),
      caption && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figcaption", { className: x.t.figcaption, children: caption })
    ] }),
    embed && x.cite && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Embed, { label: citeLabels(x.cite).image, code: embed, t: x.t })
  ] });
}
function Table({ token, x }) {
  const align = (cell) => cell.align ? { textAlign: cell.align } : void 0;
  const n = x.nums.get(token);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(x.c.Reveal, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "div",
      {
        id: x.cite && n ? tableId(n) : void 0,
        tabIndex: 0,
        role: "region",
        "aria-label": "Table",
        className: x.t.tableWrap,
        style: { overflowX: "auto" },
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { className: x.t.table, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { className: x.t.thead, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: token.header.map((cell, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { scope: "col", className: x.t.th, style: align(cell), children: inline(cell.tokens, x) }, i)) }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: token.rows.map((row, r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { className: x.t.tr, children: row.map((cell, c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: c === 0 ? x.t.tdFirst ?? x.t.td : x.t.td, style: align(cell), children: inline(cell.tokens, x) }, c)) }, r)) })
        ] })
      }
    ),
    x.cite && n && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Embed, { label: citeLabels(x.cite).table, code: tableCredit(x.cite, n), t: x.t })
  ] });
}
function Quote({ token, x }) {
  const [first, ...rest] = token.tokens;
  const lead = first?.type === "paragraph" ? first.tokens : [];
  if (lead[0]?.type === "strong") {
    const titled = lead.length === 1;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(x.c.Reveal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { role: "note", className: x.t.callout, children: [
      titled && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: x.t.calloutTitle, children: inline(lead[0].tokens, x) }),
      blocks(titled ? rest : token.tokens, x)
    ] }) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("blockquote", { className: x.t.quote, children: blocks(token.tokens, x) });
}
function List({ token, x }) {
  const Tag = token.ordered ? "ol" : "ul";
  const start = token.ordered && typeof token.start === "number" && token.start !== 1 ? token.start : void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { start, className: token.ordered ? x.t.ol : x.t.ul, children: token.items.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { className: x.t.li, children: blocks(item.tokens, x) }, i)) });
}
function block(token, x) {
  switch (token.type) {
    case "heading":
      return token.depth <= 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: x.t.h2, children: inline(token.tokens, x) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: x.t.h3, children: inline(token.tokens, x) });
    case "paragraph": {
      const image = figureImage(token.tokens ?? []);
      return image ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Figure, { image, n: x.nums.get(token), x }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: x.t.p, children: inline(token.tokens, x) });
    }
    case "text":
      return "tokens" in token && token.tokens ? inline(token.tokens, x) : decodeEntities(token.text);
    case "list":
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, { token, x });
    case "table":
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Table, { token, x });
    case "blockquote":
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quote, { token, x });
    case "hr":
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("hr", { className: x.t.hr });
    case "code":
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", { className: x.t.pre, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: token.text }) });
    default:
      return null;
  }
}
function plainText(tokens) {
  return (tokens ?? []).map((t) => "tokens" in t && t.tokens ? plainText(t.tokens) : "text" in t ? decodeEntities(String(t.text)) : "").join("");
}
function splitAtHeadings(tokens) {
  const groups = [{ heading: null, tokens: [] }];
  for (const token of tokens) {
    if (token.type === "heading" && token.depth <= 2) groups.push({ heading: token, tokens: [] });
    else groups[groups.length - 1].tokens.push(token);
  }
  return groups;
}
function blocks(tokens, x) {
  return tokens.map((token, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Fragment, { children: block(token, x) }, i));
}
function PostBody({ markdown, components, theme, figureSizes, cite, citeBox = true, sections }) {
  const tokens = import_marked.marked.lexer(markdown);
  const first = tokens.findIndex((t2) => t2.type !== "space");
  if (tokens[first]?.type === "heading" && tokens[first].depth === 1) tokens.splice(first, 1);
  const t = theme ?? {};
  const x = { c: { ...defaults, ...components }, t, sizes: figureSizes, cite, nums: numberBlocks(tokens, /* @__PURE__ */ new WeakMap()) };
  const body = sections ? splitAtHeadings(tokens).map(
    (group, index) => group.heading === null && !group.tokens.some((tk) => tk.type !== "space") ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Fragment, { children: sections({
      index,
      heading: group.heading ? block(group.heading, x) : null,
      headingText: group.heading ? plainText(group.heading.tokens) : "",
      children: blocks(group.tokens, x)
    }) }, index)
  ) : blocks(tokens, x);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    body,
    cite && citeBox && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CiteThis, { cite, theme: t })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CiteThis,
  FIGURE_HEIGHT,
  FIGURE_WIDTH,
  PostBody,
  decodeEntities
});
