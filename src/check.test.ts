import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkPosts, checkSite, formatReport } from "./check";

const fm = (date: string, extra = "") => `---\ntitle: "T"\ndate: ${date}\nsummary: "S"\n${extra}---\n`;
const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");
const standardBody = `> **Key takeaways**\n> - one\n\n${words(800)}\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\n![a](/a.webp "c")\n\n![b](/b.webp "c")\n`;

test("a post dated after the cut-off must meet the standard; an older one needn't", () => {
  const r = checkPosts(
    [
      { slug: "new-thin-post", raw: fm("2026-10-13") + "Too short." },
      { slug: "old-thin-post", raw: fm("2026-07-01") + "Too short." },
      { slug: "new-good-post", raw: fm("2026-10-13") + standardBody },
    ],
    { since: "2026-10-07" },
  );
  assert.deepEqual(r.failed.map((f) => f.slug), ["new-thin-post"]);
  assert.match(r.failed[0].errors.join(" "), /words/);
});

test("legacy slugs are exempt from the standard but still must parse", () => {
  const r = checkPosts([{ slug: "legacy-post", raw: fm("2026-10-13") + "Short." }], { since: "2026-01-01", legacy: ["legacy-post"] });
  assert.equal(r.ok, true);
});

test("duplicate slugs that differ only by case are caught", () => {
  const r = checkPosts([
    { slug: "peels", raw: fm("2026-01-01") + "x" },
    { slug: "Peels", raw: fm("2026-01-01") + "x" },
  ]);
  assert.ok(r.failed.some((f) => f.errors.some((e) => e.includes("duplicate slug"))));
});

test("on disk: a missing image fails the build, a present one passes", () => {
  const root = mkdtempSync(join(tmpdir(), "blog-standard-"));
  mkdirSync(join(root, "content/blog"), { recursive: true });
  mkdirSync(join(root, "public/images/blog/p"), { recursive: true });
  writeFileSync(join(root, "public/images/blog/p/cover.webp"), "x");
  writeFileSync(join(root, "content/blog/p.md"), fm("2026-01-01", "image: /images/blog/p/cover.webp\n") + "![x](/images/blog/p/missing.webp)");
  const r = checkSite({ postsDir: join(root, "content/blog"), publicDir: join(root, "public") });
  assert.equal(r.ok, false);
  assert.match(formatReport(r), /missing\.webp doesn't exist/);
  assert.doesNotMatch(formatReport(r), /cover\.webp/);
});

test("no posts folder yet is fine", () => {
  assert.equal(checkSite({ postsDir: "/nonexistent/blog" }).ok, true);
});
