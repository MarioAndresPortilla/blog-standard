import {
  articleLink,
  citation,
  citeLabels,
  figureId,
  imageEmbed,
  tableCredit,
  tableId
} from "./chunk-BN4TPIYL.js";

// src/react.tsx
import { Fragment } from "react";
import { marked } from "marked";
import { Fragment as Fragment2, jsx, jsxs } from "react/jsx-runtime";
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
  Image: ({ src, alt, width, height, sizes, className }) => /* @__PURE__ */ jsx("img", { src, alt, width, height, sizes, className, loading: "lazy", decoding: "async" }),
  Link: ({ href, className, children }) => isExternal(href) ? /* @__PURE__ */ jsx("a", { href, className, target: "_blank", rel: "noopener noreferrer", children }) : /* @__PURE__ */ jsx("a", { href, className, children }),
  Video: ({ src, label, width, height, className }) => /* @__PURE__ */ jsx("video", { src, "aria-label": label, width, height, className, muted: true, loop: true, autoPlay: true, playsInline: true }),
  Reveal: ({ children }) => /* @__PURE__ */ jsx(Fragment2, { children })
};
function inline(tokens, x) {
  return tokens?.map((token, i) => /* @__PURE__ */ jsx(Fragment, { children: inlineToken(token, x) }, i));
}
function inlineToken(token, x) {
  switch (token.type) {
    case "text":
      return "tokens" in token && token.tokens ? inline(token.tokens, x) : decodeEntities(token.text);
    case "escape":
      return token.text;
    case "strong":
      return /* @__PURE__ */ jsx("strong", { className: x.t.strong, children: inline(token.tokens, x) });
    case "em":
      return /* @__PURE__ */ jsx("em", { children: inline(token.tokens, x) });
    case "del":
      return /* @__PURE__ */ jsx("del", { children: inline(token.tokens, x) });
    case "codespan":
      return /* @__PURE__ */ jsx("code", { className: x.t.code, children: decodeEntities(token.text) });
    case "br":
      return /* @__PURE__ */ jsx("br", {});
    case "link":
      return /* @__PURE__ */ jsx(x.c.Link, { href: token.href, className: x.t.link, children: inline(token.tokens, x) });
    case "image":
      return /* @__PURE__ */ jsx(
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
  return /* @__PURE__ */ jsx("pre", { className: t.embedCode, style: SNIPPET, children: /* @__PURE__ */ jsx("code", { children: code }) });
}
function Embed({ label, code, t }) {
  return /* @__PURE__ */ jsxs("details", { className: t.embed, children: [
    /* @__PURE__ */ jsx("summary", { className: t.embedSummary, children: label }),
    /* @__PURE__ */ jsx(Snippet, { code, t })
  ] });
}
function CiteThis({ cite, theme }) {
  const t = theme ?? {};
  const labels = citeLabels(cite);
  return /* @__PURE__ */ jsx("aside", { "aria-label": labels.article, className: t.cite, children: /* @__PURE__ */ jsxs("details", { className: t.embed, children: [
    /* @__PURE__ */ jsx("summary", { className: t.embedSummary, children: labels.article }),
    /* @__PURE__ */ jsx("p", { className: t.citeLabel, children: labels.link }),
    /* @__PURE__ */ jsx(Snippet, { code: articleLink(cite), t }),
    /* @__PURE__ */ jsx("p", { className: t.citeLabel, children: labels.citation }),
    /* @__PURE__ */ jsx(Snippet, { code: citation(cite), t })
  ] }) });
}
function Figure({ image, n, x }) {
  const alt = decodeEntities(image.text);
  const caption = image.title ? decodeEntities(image.title.trim()) : "";
  const video = VIDEO.test(image.href);
  const embed = x.cite && n && !video ? imageEmbed(x.cite, { src: image.href, alt, n }) : null;
  return /* @__PURE__ */ jsxs(x.c.Reveal, { children: [
    /* @__PURE__ */ jsxs("figure", { id: x.cite && n ? figureId(n) : void 0, className: x.t.figure, children: [
      video ? /* @__PURE__ */ jsx(x.c.Video, { src: image.href, label: alt, width: FIGURE_WIDTH, height: FIGURE_HEIGHT, className: x.t.media }) : /* @__PURE__ */ jsx(x.c.Image, { src: image.href, alt, width: FIGURE_WIDTH, height: FIGURE_HEIGHT, sizes: x.sizes, className: x.t.media }),
      caption && /* @__PURE__ */ jsx("figcaption", { className: x.t.figcaption, children: caption })
    ] }),
    embed && x.cite && /* @__PURE__ */ jsx(Embed, { label: citeLabels(x.cite).image, code: embed, t: x.t })
  ] });
}
function Table({ token, x }) {
  const align = (cell) => cell.align ? { textAlign: cell.align } : void 0;
  const n = x.nums.get(token);
  return /* @__PURE__ */ jsxs(x.c.Reveal, { children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        id: x.cite && n ? tableId(n) : void 0,
        tabIndex: 0,
        role: "region",
        "aria-label": "Table",
        className: x.t.tableWrap,
        style: { overflowX: "auto" },
        children: /* @__PURE__ */ jsxs("table", { className: x.t.table, children: [
          /* @__PURE__ */ jsx("thead", { className: x.t.thead, children: /* @__PURE__ */ jsx("tr", { children: token.header.map((cell, i) => /* @__PURE__ */ jsx("th", { scope: "col", className: x.t.th, style: align(cell), children: inline(cell.tokens, x) }, i)) }) }),
          /* @__PURE__ */ jsx("tbody", { children: token.rows.map((row, r) => /* @__PURE__ */ jsx("tr", { className: x.t.tr, children: row.map((cell, c) => /* @__PURE__ */ jsx("td", { className: c === 0 ? x.t.tdFirst ?? x.t.td : x.t.td, style: align(cell), children: inline(cell.tokens, x) }, c)) }, r)) })
        ] })
      }
    ),
    x.cite && n && /* @__PURE__ */ jsx(Embed, { label: citeLabels(x.cite).table, code: tableCredit(x.cite, n), t: x.t })
  ] });
}
function Quote({ token, x }) {
  const [first, ...rest] = token.tokens;
  const lead = first?.type === "paragraph" ? first.tokens : [];
  if (lead[0]?.type === "strong") {
    const titled = lead.length === 1;
    return /* @__PURE__ */ jsx(x.c.Reveal, { children: /* @__PURE__ */ jsxs("div", { role: "note", className: x.t.callout, children: [
      titled && /* @__PURE__ */ jsx("p", { className: x.t.calloutTitle, children: inline(lead[0].tokens, x) }),
      blocks(titled ? rest : token.tokens, x)
    ] }) });
  }
  return /* @__PURE__ */ jsx("blockquote", { className: x.t.quote, children: blocks(token.tokens, x) });
}
function List({ token, x }) {
  const Tag = token.ordered ? "ol" : "ul";
  const start = token.ordered && typeof token.start === "number" && token.start !== 1 ? token.start : void 0;
  return /* @__PURE__ */ jsx(Tag, { start, className: token.ordered ? x.t.ol : x.t.ul, children: token.items.map((item, i) => /* @__PURE__ */ jsx("li", { className: x.t.li, children: blocks(item.tokens, x) }, i)) });
}
function block(token, x) {
  switch (token.type) {
    case "heading":
      return token.depth <= 2 ? /* @__PURE__ */ jsx("h2", { className: x.t.h2, children: inline(token.tokens, x) }) : /* @__PURE__ */ jsx("h3", { className: x.t.h3, children: inline(token.tokens, x) });
    case "paragraph": {
      const image = figureImage(token.tokens ?? []);
      return image ? /* @__PURE__ */ jsx(Figure, { image, n: x.nums.get(token), x }) : /* @__PURE__ */ jsx("p", { className: x.t.p, children: inline(token.tokens, x) });
    }
    case "text":
      return "tokens" in token && token.tokens ? inline(token.tokens, x) : decodeEntities(token.text);
    case "list":
      return /* @__PURE__ */ jsx(List, { token, x });
    case "table":
      return /* @__PURE__ */ jsx(Table, { token, x });
    case "blockquote":
      return /* @__PURE__ */ jsx(Quote, { token, x });
    case "hr":
      return /* @__PURE__ */ jsx("hr", { className: x.t.hr });
    case "code":
      return /* @__PURE__ */ jsx("pre", { className: x.t.pre, children: /* @__PURE__ */ jsx("code", { children: token.text }) });
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
  return tokens.map((token, i) => /* @__PURE__ */ jsx(Fragment, { children: block(token, x) }, i));
}
function PostBody({ markdown, components, theme, figureSizes, cite, citeBox = true, sections }) {
  const tokens = marked.lexer(markdown);
  const first = tokens.findIndex((t2) => t2.type !== "space");
  if (tokens[first]?.type === "heading" && tokens[first].depth === 1) tokens.splice(first, 1);
  const t = theme ?? {};
  const x = { c: { ...defaults, ...components }, t, sizes: figureSizes, cite, nums: numberBlocks(tokens, /* @__PURE__ */ new WeakMap()) };
  const body = sections ? splitAtHeadings(tokens).map(
    (group, index) => group.heading === null && !group.tokens.some((tk) => tk.type !== "space") ? null : /* @__PURE__ */ jsx(Fragment, { children: sections({
      index,
      heading: group.heading ? block(group.heading, x) : null,
      headingText: group.heading ? plainText(group.heading.tokens) : "",
      children: blocks(group.tokens, x)
    }) }, index)
  ) : blocks(tokens, x);
  return /* @__PURE__ */ jsxs(Fragment2, { children: [
    body,
    cite && citeBox && /* @__PURE__ */ jsx(CiteThis, { cite, theme: t })
  ] });
}
export {
  CiteThis,
  FIGURE_HEIGHT,
  FIGURE_WIDTH,
  PostBody,
  decodeEntities
};
