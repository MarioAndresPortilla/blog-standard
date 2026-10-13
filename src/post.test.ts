import { test } from "node:test";
import assert from "node:assert/strict";
import { localImagePaths, parsePost } from "./post";

const good = `---
title: "Chemical Peel Types Explained"
date: 2026-10-13
summary: "Light, medium or deep?"
tags: ["peels"]
category: "Treatments"
image: /images/blog/chemical-peel-types/cover.webp
imageAlt: "A peel being applied"
---

> **Key takeaways**
> - Depth decides downtime.

![A peel](/images/blog/chemical-peel-types/figure-1.webp "Light peels lift the surface")
`;

test("a well-formed post parses, an unquoted YAML date included", () => {
  const r = parsePost("chemical-peel-types", good);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.post.frontMatter.date, "2026-10-13");
  assert.equal(r.post.frontMatter.category, "Treatments");
  assert.ok(r.post.markdown.startsWith("> **Key takeaways**"));
});

test("missing fields, a bad date, a bad image path and a bad slug are each named", () => {
  const r = parsePost("Bad_Slug", `---\ndate: last tuesday\nimage: images/x.webp\n---\nBody`);
  assert.equal(r.ok, false);
  if (r.ok) return;
  const all = r.errors.join(" | ");
  assert.match(all, /title/);
  assert.match(all, /summary/);
  assert.match(all, /YYYY-MM-DD/);
  assert.match(all, /site-root path/);
  assert.match(all, /lowercase words/);
});

test("broken YAML is reported, not thrown", () => {
  const r = parsePost("x", `---\ntitle: [unclosed\n---\nBody`);
  assert.equal(r.ok, false);
});

test("the cover and every body image are found for existence checks; remote ones aren't", () => {
  const r = parsePost("chemical-peel-types", good + `\n![remote](https://cdn.example.com/a.png)\n`);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.deepEqual(localImagePaths(r.post).sort(), [
    "/images/blog/chemical-peel-types/cover.webp",
    "/images/blog/chemical-peel-types/figure-1.webp",
  ]);
});
