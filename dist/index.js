import {
  MAX_FIGURES,
  MAX_WORDS,
  MIN_FIGURES,
  MIN_WORDS,
  STANDARD_MARKER,
  STANDARD_VERSION,
  TARGET_WORDS,
  checkPosts,
  checkSite,
  checkStandard,
  countWords,
  findFigures,
  formatReport,
  frontMatterSchema,
  localImagePaths,
  parsePost,
  placeFigures,
  readingMinutes,
  slugProblem
} from "./chunk-ALXOOS3L.js";

// src/hub.ts
var DEFAULT_HUB = "https://seo-machine-bay.vercel.app";
function toPost(raw) {
  if (typeof raw?.slug !== "string" || slugProblem(raw.slug) || typeof raw.markdown !== "string") return null;
  const fm = frontMatterSchema.safeParse(raw.frontMatter);
  return fm.success ? { slug: raw.slug, frontMatter: fm.data, markdown: raw.markdown } : null;
}
async function get(opts, path) {
  const base = (opts.hub ?? DEFAULT_HUB).replace(/\/+$/, "");
  const url = `${base}/api/content/${encodeURIComponent(opts.site)}/posts${path}`;
  try {
    const res = await (opts.fetch ?? fetch)(url, {
      // Next.js data cache: a fresh copy every `revalidate` seconds, and the
      // last good one in between (or if the hub is down). Ignored elsewhere.
      next: { revalidate: opts.revalidate ?? 300, tags: [`seo-hub:${opts.site}`] }
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`hub answered ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[blog-standard] hub unreachable (${url}): ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}
async function hubPosts(opts) {
  const body = await get(opts, "");
  return (body?.posts ?? []).map(toPost).filter((p) => p !== null);
}
async function hubPost(opts) {
  const body = await get(opts, `/${encodeURIComponent(opts.slug)}`);
  return body?.post ? toPost(body.post) : null;
}
function mergePosts(local, hub) {
  const bySlug = /* @__PURE__ */ new Map();
  for (const p of local) bySlug.set(p.slug, p);
  for (const p of hub) bySlug.set(p.slug, p);
  return [...bySlug.values()].sort((a, b) => b.frontMatter.date.localeCompare(a.frontMatter.date));
}
export {
  DEFAULT_HUB,
  MAX_FIGURES,
  MAX_WORDS,
  MIN_FIGURES,
  MIN_WORDS,
  STANDARD_MARKER,
  STANDARD_VERSION,
  TARGET_WORDS,
  checkPosts,
  checkSite,
  checkStandard,
  countWords,
  findFigures,
  formatReport,
  frontMatterSchema,
  hubPost,
  hubPosts,
  localImagePaths,
  mergePosts,
  parsePost,
  placeFigures,
  readingMinutes,
  slugProblem
};
