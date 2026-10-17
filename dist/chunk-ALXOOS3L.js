// src/standard.ts
var STANDARD_VERSION = "v1";
var STANDARD_MARKER = `blog-standard: ${STANDARD_VERSION}`;
var TARGET_WORDS = 1e3;
var MIN_WORDS = 700;
var MAX_WORDS = 1400;
var MIN_FIGURES = 2;
var MAX_FIGURES = 3;
var FIGURE_LINE = /^[ \t]*\[\[figure:([^\]]*)\]\][ \t]*$/gim;
function findFigures(body) {
  const out = [];
  for (const m of body.matchAll(FIGURE_LINE)) {
    const [alt, caption, ...brief] = m[1].split("|").map((s) => s.trim());
    if (alt && brief.join(" ").trim()) out.push({ alt, caption: caption ?? "", brief: brief.join(" | ").trim() });
  }
  return out;
}
function placeFigures(body, srcs) {
  let i = 0;
  return body.replace(FIGURE_LINE, (line) => {
    const [fig] = findFigures(line);
    if (!fig || i >= Math.min(srcs.length, MAX_FIGURES)) return "";
    const src = srcs[i++];
    return `![${escapeAlt(fig.alt)}](${src}${fig.caption ? ` "${fig.caption.replace(/"/g, "'")}"` : ""})`;
  }).replace(/\n{3,}/g, "\n\n").trimEnd();
}
function escapeAlt(alt) {
  return alt.replace(/[[\]]/g, "");
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
function readingMinutes(body) {
  return Math.max(1, Math.ceil(countWords(body) / 225));
}

// src/post.ts
import matter from "gray-matter";
import { z } from "zod";
var isoDay = z.union([z.string(), z.date()]).transform((v, ctx) => {
  const s = v instanceof Date ? v.toISOString().slice(0, 10) : v.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s))) {
    ctx.addIssue({ code: "custom", message: `date must be YYYY-MM-DD, got "${String(v)}"` });
    return z.NEVER;
  }
  return s;
});
var sitePath = z.string().refine((s) => s.startsWith("/") || /^https?:\/\//.test(s), "must be a site-root path (/images/...) or an absolute URL");
var frontMatterSchema = z.object({
  title: z.string().trim().min(1, "title is required"),
  date: isoDay,
  summary: z.string().trim().min(1, "summary is required"),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  image: sitePath.optional(),
  imageAlt: z.string().optional(),
  coverSubject: z.string().optional(),
  type: z.string().optional(),
  // The standard version a post declares it meets ("v1"). The SEO Machine
  // writes it on every post; a declared post is always held to the standard.
  standard: z.string().optional()
}).passthrough();
function slugProblem(slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return `slug "${slug}" must be lowercase words joined by single hyphens`;
  if (slug.length > 80) return `slug "${slug}" is ${slug.length} characters; keep it under 80`;
  return null;
}
function parsePost(slug, raw) {
  let parsed;
  try {
    parsed = matter(raw);
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
import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
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
        if (!existsSync(join(opts.publicDir, p))) errors.push(`image ${p} doesn't exist under ${opts.publicDir}`);
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
  if (!existsSync(opts.postsDir)) return { checked: 0, failed: [], ok: true };
  const posts = readdirSync(opts.postsDir).filter((f) => f.endsWith(".md")).sort().map((f) => ({ slug: f.replace(/\.md$/, ""), raw: readFileSync(join(opts.postsDir, f), "utf8") }));
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

export {
  STANDARD_VERSION,
  STANDARD_MARKER,
  TARGET_WORDS,
  MIN_WORDS,
  MAX_WORDS,
  MIN_FIGURES,
  MAX_FIGURES,
  findFigures,
  placeFigures,
  countWords,
  checkStandard,
  readingMinutes,
  frontMatterSchema,
  slugProblem,
  parsePost,
  localImagePaths,
  checkPosts,
  checkSite,
  formatReport
};
