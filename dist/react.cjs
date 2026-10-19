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
  FIGURE_HEIGHT: () => FIGURE_HEIGHT,
  FIGURE_WIDTH: () => FIGURE_WIDTH,
  PostBody: () => PostBody,
  decodeEntities: () => decodeEntities
});
module.exports = __toCommonJS(react_exports);
var import_react = require("react");
var import_marked = require("marked");
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
function Figure({ image, x }) {
  const alt = decodeEntities(image.text);
  const caption = image.title ? decodeEntities(image.title.trim()) : "";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(x.c.Reveal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", { className: x.t.figure, children: [
    VIDEO.test(image.href) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(x.c.Video, { src: image.href, label: alt, width: FIGURE_WIDTH, height: FIGURE_HEIGHT, className: x.t.media }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(x.c.Image, { src: image.href, alt, width: FIGURE_WIDTH, height: FIGURE_HEIGHT, sizes: x.sizes, className: x.t.media }),
    caption && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figcaption", { className: x.t.figcaption, children: caption })
  ] }) });
}
function Table({ token, x }) {
  const align = (cell) => cell.align ? { textAlign: cell.align } : void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(x.c.Reveal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { tabIndex: 0, role: "region", "aria-label": "Table", className: x.t.tableWrap, style: { overflowX: "auto" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { className: x.t.table, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { className: x.t.thead, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: token.header.map((cell, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { scope: "col", className: x.t.th, style: align(cell), children: inline(cell.tokens, x) }, i)) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: token.rows.map((row, r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { className: x.t.tr, children: row.map((cell, c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: c === 0 ? x.t.tdFirst ?? x.t.td : x.t.td, style: align(cell), children: inline(cell.tokens, x) }, c)) }, r)) })
  ] }) }) });
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
      return image ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Figure, { image, x }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: x.t.p, children: inline(token.tokens, x) });
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
function blocks(tokens, x) {
  return tokens.map((token, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Fragment, { children: block(token, x) }, i));
}
function PostBody({ markdown, components, theme, figureSizes }) {
  const tokens = import_marked.marked.lexer(markdown);
  const first = tokens.findIndex((t) => t.type !== "space");
  if (tokens[first]?.type === "heading" && tokens[first].depth === 1) tokens.splice(first, 1);
  const x = { c: { ...defaults, ...components }, t: theme ?? {}, sizes: figureSizes };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: blocks(tokens, x) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FIGURE_HEIGHT,
  FIGURE_WIDTH,
  PostBody,
  decodeEntities
});
