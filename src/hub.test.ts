import { test } from "node:test";
import assert from "node:assert/strict";
import { hubPost, hubPosts, mergePosts } from "./hub";
import type { Post } from "./post";

const fm = (title: string, date: string) => ({ title, date, summary: "s", publishedAt: `${date}T10:00:00.000Z`, updatedAt: `${date}T10:00:00.000Z` });
const post = (slug: string, date: string, title = slug) => ({ slug, frontMatter: fm(title, date), markdown: "## H\n\nBody." });

function fakeFetch(routes: Record<string, { status?: number; body?: unknown } | Error>, seen: { url: string; init?: RequestInit }[] = []) {
  return (async (url: string, init?: RequestInit) => {
    seen.push({ url, init });
    const r = routes[url];
    if (r instanceof Error) throw r;
    if (!r) return new Response("{}", { status: 404 });
    return new Response(JSON.stringify(r.body), { status: r.status ?? 200 });
  }) as unknown as typeof fetch;
}

const HUB = "https://hub.example.com";

test("published posts come back as posts, checked like post files; malformed ones are dropped", async () => {
  const seen: { url: string; init?: RequestInit }[] = [];
  const fetch = fakeFetch(
    { [`${HUB}/api/content/360-radiance/posts`]: { body: { posts: [post("retinol-guide", "2026-10-14"), { slug: "Bad Slug", frontMatter: fm("x", "2026-10-01"), markdown: "x" }, { slug: "no-title", frontMatter: { date: "2026-10-01" }, markdown: "x" }] } } },
    seen,
  );
  const posts = await hubPosts({ site: "360-radiance", hub: HUB, fetch });
  assert.deepEqual(posts.map((p) => p.slug), ["retinol-guide"]);
  assert.equal(posts[0].frontMatter.title, "retinol-guide");
  const next = (seen[0].init as { next?: { revalidate?: number; tags?: string[] } }).next;
  assert.deepEqual(next, { revalidate: 300, tags: ["seo-hub:360-radiance"] }, "cached by Next.js, tagged per site");
});

test("a hub that can't be reached is no posts, never an error — the site keeps its own", async () => {
  const down = fakeFetch({ [`${HUB}/api/content/x/posts`]: new Error("ECONNREFUSED") });
  assert.deepEqual(await hubPosts({ site: "x", hub: HUB, fetch: down }), []);
  const broken = fakeFetch({ [`${HUB}/api/content/x/posts`]: { status: 500, body: {} } });
  assert.deepEqual(await hubPosts({ site: "x", hub: HUB, fetch: broken }), []);
  assert.equal(await hubPost({ site: "x", slug: "y", hub: HUB, fetch: down }), null);
});

test("one post by slug; not in the hub is null", async () => {
  const fetch = fakeFetch({ [`${HUB}/api/content/s/posts/a-post`]: { body: { post: post("a-post", "2026-10-01") } } });
  assert.equal((await hubPost({ site: "s", slug: "a-post", hub: HUB, fetch }))?.slug, "a-post");
  assert.equal(await hubPost({ site: "s", slug: "other", hub: HUB, fetch }), null);
});

test("files and hub posts merge newest first; the site's own file wins a shared slug", () => {
  const local = [post("old-file", "2026-01-01"), post("shared", "2026-05-01", "file title")] as Post[];
  const hub = [post("shared", "2026-05-01", "hub title"), post("new-hub", "2026-10-01")] as Post[];
  const merged = mergePosts(local, hub);
  assert.deepEqual(merged.map((p) => p.slug), ["new-hub", "shared", "old-file"]);
  assert.equal(merged[1].frontMatter.title, "file title", "the file keeps the site's own front-matter");
});
