// Read a site's posts from the SEO Machine hub (its content API), for sites
// whose posts are published there rather than committed to the repo.
//
// Never throws: when the hub can't be reached a site keeps serving what it
// has — its own post files, and (in Next.js) the last copy it fetched. Hub
// posts arrive in the same shape as a post file (`Post`), so a site renders
// them with the same code.

import { frontMatterSchema, slugProblem, type Post } from "./post";

export const DEFAULT_HUB = "https://seo-machine-bay.vercel.app";

export interface HubOptions {
  /** This site's id in the hub (its brand id, e.g. "360-radiance"). */
  site: string;
  /** The hub's base URL. Default: the SEO Machine's production hub. */
  hub?: string;
  /** Seconds a fetched copy stays fresh in Next.js's data cache. Default 300. */
  revalidate?: number;
  /** For tests, or a non-Next runtime. */
  fetch?: typeof fetch;
}

type Raw = { slug?: unknown; frontMatter?: unknown; markdown?: unknown };

/** A hub post, checked like a post file; anything malformed is dropped, not rendered. */
function toPost(raw: Raw): Post | null {
  if (typeof raw?.slug !== "string" || slugProblem(raw.slug) || typeof raw.markdown !== "string") return null;
  const fm = frontMatterSchema.safeParse(raw.frontMatter);
  return fm.success ? { slug: raw.slug, frontMatter: fm.data, markdown: raw.markdown } : null;
}

async function get(opts: HubOptions, path: string): Promise<unknown | null> {
  const base = (opts.hub ?? DEFAULT_HUB).replace(/\/+$/, "");
  const url = `${base}/api/content/${encodeURIComponent(opts.site)}/posts${path}`;
  try {
    const res = await (opts.fetch ?? fetch)(url, {
      // Next.js data cache: a fresh copy every `revalidate` seconds, and the
      // last good one in between (or if the hub is down). Ignored elsewhere.
      next: { revalidate: opts.revalidate ?? 300, tags: [`seo-hub:${opts.site}`] },
    } as RequestInit);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`hub answered ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[blog-standard] hub unreachable (${url}): ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

/** Every published post the hub has for this site, newest first. [] if it can't be reached. */
export async function hubPosts(opts: HubOptions): Promise<Post[]> {
  const body = (await get(opts, "")) as { posts?: Raw[] } | null;
  return (body?.posts ?? []).map(toPost).filter((p): p is Post => p !== null);
}

/** One published post by slug, or null (not in the hub, or the hub can't be reached). */
export async function hubPost(opts: HubOptions & { slug: string }): Promise<Post | null> {
  const body = (await get(opts, `/${encodeURIComponent(opts.slug)}`)) as { post?: Raw } | null;
  return body?.post ? toPost(body.post) : null;
}

/**
 * A site's own post files and its hub posts as one list, newest first. The
 * hub's copy wins when both have a slug — it's the one being edited.
 */
export function mergePosts(local: Post[], hub: Post[]): Post[] {
  const bySlug = new Map<string, Post>();
  for (const p of local) bySlug.set(p.slug, p);
  for (const p of hub) bySlug.set(p.slug, p);
  return [...bySlug.values()].sort((a, b) => b.frontMatter.date.localeCompare(a.frontMatter.date));
}
