#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/check.ts
var import_node_fs = require("fs");
var import_node_path = require("path");

// src/standard.ts
var STANDARD_VERSION = "v1";
var STANDARD_MARKER = `blog-standard: ${STANDARD_VERSION}`;
var MIN_WORDS = 700;
var MAX_WORDS = 1400;
var MIN_FIGURES = 2;
var FIGURE_LINE = /^[ \t]*\[\[figure:([^\]]*)\]\][ \t]*$/gim;
function findFigures(body) {
  const out = [];
  for (const m of body.matchAll(FIGURE_LINE)) {
    const [alt, caption, ...brief] = m[1].split("|").map((s) => s.trim());
    if (alt && brief.join(" ").trim()) out.push({ alt, caption: caption ?? "", brief: brief.join(" | ").trim() });
  }
  return out;
}
var DIVIDER_SOURCE = String.raw`^\s*\|?(?:\s*:?-+:?\s*\|)+(?:\s*:?-+:?\s*)?$`;
var TABLE_DIVIDER = new RegExp(DIVIDER_SOURCE);
var TABLE_DIVIDER_GLOBAL = new RegExp(DIVIDER_SOURCE, "gm");
function countWords(body) {
  const text = body.replace(FIGURE_LINE, " ").replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\]\([^)]*\)/g, "]").replace(TABLE_DIVIDER_GLOBAL, " ").replace(/[#>*_`|[\]-]/g, " ");
  return (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’]*/gu) ?? []).length;
}
function countTables(body) {
  const lines = body.split("\n");
  let n = 0;
  for (let i = 1; i < lines.length; i++) {
    if (TABLE_DIVIDER.test(lines[i]) && lines[i - 1].includes("|")) n++;
  }
  return n;
}
function countImages(body) {
  return findFigures(body).length + (body.match(/!\[[^\]]*\]\([^)]+\)/g) ?? []).length;
}
var TAKEAWAYS = /^\s*>\s*\*\*\s*key takeaways?\s*:?\s*\*\*/im;
function checkStandard(body) {
  const words = countWords(body);
  const figures = countImages(body);
  const tables = countTables(body);
  const takeaways = TAKEAWAYS.test(body);
  const problems = [];
  if (words > MAX_WORDS) problems.push(`${words} words \u2014 the blog standard caps a post at ${MAX_WORDS} (aim for 800\u20131,200).`);
  if (words < MIN_WORDS) problems.push(`${words} words \u2014 under the blog standard's ${MIN_WORDS}-word floor.`);
  if (figures < MIN_FIGURES) problems.push(`${figures} inline visual${figures === 1 ? "" : "s"} \u2014 the blog standard needs at least ${MIN_FIGURES}.`);
  if (tables < 1) problems.push("No table \u2014 the blog standard needs at least one.");
  if (!takeaways) problems.push('No "Key takeaways" callout near the top \u2014 the blog standard needs one.');
  return { words, figures, tables, takeaways, problems };
}

// src/post.ts
var import_gray_matter = __toESM(require("gray-matter"), 1);
var import_zod = require("zod");
var isoDay = import_zod.z.union([import_zod.z.string(), import_zod.z.date()]).transform((v, ctx) => {
  const s = v instanceof Date ? v.toISOString().slice(0, 10) : v.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s))) {
    ctx.addIssue({ code: "custom", message: `date must be YYYY-MM-DD, got "${String(v)}"` });
    return import_zod.z.NEVER;
  }
  return s;
});
var sitePath = import_zod.z.string().refine((s) => s.startsWith("/") || /^https?:\/\//.test(s), "must be a site-root path (/images/...) or an absolute URL");
var frontMatterSchema = import_zod.z.object({
  title: import_zod.z.string().trim().min(1, "title is required"),
  date: isoDay,
  summary: import_zod.z.string().trim().min(1, "summary is required"),
  tags: import_zod.z.array(import_zod.z.string()).optional(),
  category: import_zod.z.string().optional(),
  image: sitePath.optional(),
  imageAlt: import_zod.z.string().optional(),
  coverSubject: import_zod.z.string().optional(),
  type: import_zod.z.string().optional(),
  // The standard version a post declares it meets ("v1"). The SEO Machine
  // writes it on every post; a declared post is always held to the standard.
  standard: import_zod.z.string().optional()
}).passthrough();
function slugProblem(slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return `slug "${slug}" must be lowercase words joined by single hyphens`;
  if (slug.length > 80) return `slug "${slug}" is ${slug.length} characters; keep it under 80`;
  return null;
}
function parsePost(slug, raw) {
  let parsed;
  try {
    parsed = (0, import_gray_matter.default)(raw);
  } catch (err) {
    return { ok: false, slug, errors: [`front-matter is not valid YAML: ${err.message.split("\n")[0]}`] };
  }
  const fm = frontMatterSchema.safeParse(parsed.data);
  const errors = fm.success ? [] : fm.error.issues.map((i) => `${i.path.join(".") || "front-matter"}: ${i.message}`);
  const slugIssue = slugProblem(slug);
  if (slugIssue) errors.push(slugIssue);
  if (!fm.success || errors.length) return { ok: false, slug, errors };
  return { ok: true, post: { slug, frontMatter: fm.data, markdown: parsed.content.trim() } };
}
function localImagePaths(post) {
  const paths = /* @__PURE__ */ new Set();
  if (post.frontMatter.image?.startsWith("/")) paths.add(post.frontMatter.image);
  for (const m of post.markdown.matchAll(/!\[[^\]]*\]\((\/[^)\s]+)(?:\s+"[^"]*")?\)/g)) paths.add(m[1]);
  return [...paths];
}

// src/check.ts
function checkPosts(posts, opts = {}) {
  const failed = [];
  const seen = /* @__PURE__ */ new Map();
  const legacy = new Set(opts.legacy ?? []);
  for (const { slug, raw } of posts) {
    const errors = [];
    const lower = slug.toLowerCase();
    if (seen.has(lower)) errors.push(`duplicate slug: also "${seen.get(lower)}"`);
    seen.set(lower, slug);
    const parsed = parsePost(slug, raw);
    if (!parsed.ok) {
      failed.push({ slug, errors: [...errors, ...parsed.errors] });
      continue;
    }
    const post = parsed.post;
    if (opts.publicDir) {
      for (const p of localImagePaths(post)) {
        if (!(0, import_node_fs.existsSync)((0, import_node_path.join)(opts.publicDir, p))) errors.push(`image ${p} doesn't exist under ${opts.publicDir}`);
      }
    }
    const declared = post.frontMatter.standard;
    if (declared !== void 0 && declared !== STANDARD_VERSION) {
      errors.push(`standard: "${declared}" isn't a version this package checks (${STANDARD_VERSION})`);
    }
    const byDate = !legacy.has(slug) && (!opts.since || post.frontMatter.date >= opts.since);
    const held = declared !== void 0 || !opts.marked && byDate;
    if (held) errors.push(...checkStandard(post.markdown).problems);
    if (errors.length) failed.push({ slug, errors });
  }
  return { checked: posts.length, failed, ok: failed.length === 0 };
}
function checkSite(opts) {
  if (!(0, import_node_fs.existsSync)(opts.postsDir)) return { checked: 0, failed: [], ok: true };
  const posts = (0, import_node_fs.readdirSync)(opts.postsDir).filter((f) => f.endsWith(".md")).sort().map((f) => ({ slug: f.replace(/\.md$/, ""), raw: (0, import_node_fs.readFileSync)((0, import_node_path.join)(opts.postsDir, f), "utf8") }));
  return checkPosts(posts, opts);
}
function formatReport(r) {
  if (r.ok) return `blog-standard: ${r.checked} post${r.checked === 1 ? "" : "s"} OK`;
  const lines = [`blog-standard: ${r.failed.length} of ${r.checked} posts need fixing`];
  for (const f of r.failed) {
    lines.push(`  ${f.slug}.md`);
    for (const e of f.errors) lines.push(`    - ${e}`);
  }
  return lines.join("\n");
}

// src/cli.ts
var USAGE = "usage: blog-standard check [postsDir] [--public <dir>] [--since YYYY-MM-DD] [--legacy slug,slug] [--marked]";
var VALUED = /* @__PURE__ */ new Set(["--public", "--since", "--legacy"]);
function arg(name, args) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : void 0;
}
var [cmd, ...rest] = process.argv.slice(2);
if (cmd !== "check") {
  console.error(USAGE);
  process.exit(2);
}
var positional = rest.filter((a, i) => !a.startsWith("--") && !VALUED.has(rest[i - 1] ?? ""));
var report = checkSite({
  postsDir: positional[0] ?? "content/blog",
  publicDir: arg("public", rest) ?? "public",
  since: arg("since", rest),
  legacy: arg("legacy", rest)?.split(",").filter(Boolean),
  marked: rest.includes("--marked")
});
console.log(formatReport(report));
process.exit(report.ok ? 0 : 1);
