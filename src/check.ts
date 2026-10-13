// Check a site's posts folder against the standard — what each client repo's CI
// runs (`blog-standard check`), and what the SEO Machine can run before it opens
// a PR. A failure here is a post that would render wrong, or not at all, on the
// live site; every one used to be found by a reader instead.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { checkStandard } from "./standard";
import { localImagePaths, parsePost, type Post } from "./post";

export interface CheckOptions {
  /** Folder of `<slug>.md` posts, e.g. "content/blog". */
  postsDir: string;
  /** The site's public folder, to check that referenced images exist. Omit to skip. */
  publicDir?: string;
  /**
   * Posts dated on or after this day (YYYY-MM-DD) must meet the full standard
   * (length, figures, table, takeaways). Older posts predate it and are only
   * checked for a valid file and working images. Omit to check every post.
   */
  since?: string;
  /** Slugs exempt from the full standard regardless of date (legacy posts). */
  legacy?: string[];
}

export interface PostReport {
  slug: string;
  errors: string[];
}

export interface CheckReport {
  checked: number;
  failed: PostReport[];
  ok: boolean;
}

export function checkPosts(posts: { slug: string; raw: string }[], opts: Omit<CheckOptions, "postsDir"> = {}): CheckReport {
  const failed: PostReport[] = [];
  const seen = new Map<string, string>();
  const legacy = new Set(opts.legacy ?? []);

  for (const { slug, raw } of posts) {
    const errors: string[] = [];

    const lower = slug.toLowerCase();
    if (seen.has(lower)) errors.push(`duplicate slug: also "${seen.get(lower)}"`);
    seen.set(lower, slug);

    const parsed = parsePost(slug, raw);
    if (!parsed.ok) {
      failed.push({ slug, errors: [...errors, ...parsed.errors] });
      continue;
    }
    const post: Post = parsed.post;

    if (opts.publicDir) {
      for (const p of localImagePaths(post)) {
        if (!existsSync(join(opts.publicDir, p))) errors.push(`image ${p} doesn't exist under ${opts.publicDir}`);
      }
    }

    const held = !legacy.has(slug) && (!opts.since || post.frontMatter.date >= opts.since);
    if (held) errors.push(...checkStandard(post.markdown).problems);

    if (errors.length) failed.push({ slug, errors });
  }
  return { checked: posts.length, failed, ok: failed.length === 0 };
}

/** Read every `<slug>.md` under `postsDir` and check it. */
export function checkSite(opts: CheckOptions): CheckReport {
  if (!existsSync(opts.postsDir)) return { checked: 0, failed: [], ok: true };
  const posts = readdirSync(opts.postsDir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => ({ slug: f.replace(/\.md$/, ""), raw: readFileSync(join(opts.postsDir, f), "utf8") }));
  return checkPosts(posts, opts);
}

/** The report as lines a person reads in a CI log. */
export function formatReport(r: CheckReport): string {
  if (r.ok) return `blog-standard: ${r.checked} post${r.checked === 1 ? "" : "s"} OK`;
  const lines = [`blog-standard: ${r.failed.length} of ${r.checked} posts need fixing`];
  for (const f of r.failed) {
    lines.push(`  ${f.slug}.md`);
    for (const e of f.errors) lines.push(`    - ${e}`);
  }
  return lines.join("\n");
}
