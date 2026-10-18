<!-- blog-standard: v1 -->
# Blog standard (v1)

Every blog post on every client site follows this, whether the SEO Machine
wrote it or a person did. Readers skim: a post should be short, broken up, and
carry most of its meaning in pictures, tables and callouts, not a ten-minute
wall of text.

The SEO Machine checks for the line `blog-standard: v1` in a `BLOG_STANDARD.md`
at the root of a client repo before it publishes there. That line means "this
site renders everything below". Do not add it to a repo until its blog renderer
does.

## What every post has

| Element | Rule |
|---|---|
| Length | 800–1,200 words of body text, about a 4–6 minute read and never more than 7. Never more than 1,400 words or under 700. |
| Cover image | One cover, used as the page hero and the social share image. Alt text required. |
| Inline visuals | 2–3 illustrations, sketches, diagrams or photos, roughly one every 300–400 words. Each has alt text and a one-line caption. |
| Table or chart | At least one table: a comparison, checklist, timeline, or "what affects the cost" grid. A chart or diagram is welcome as one of the inline visuals. Never a wall of text. |
| Key takeaways | A callout near the top with 3–4 bullets, so a skimmer gets the point in ten seconds. |
| Paragraphs | Three sentences at most. A descriptive `##` heading every 150–250 words. Lists where they help. |
| Honesty | No invented statistics, prices, dates or credentials. No words, logos or numbers baked into images. |

Motion where it helps: figures, tables and callouts reveal on scroll, and a
looping clip (`.mp4`/`.webm`) can stand in for a still when movement explains
something better.

Images are generated with the OpenAI Images API when there is no real photo:
`gpt-image-2.5-flare`, 1536×1024, WebP. Each brand has its own illustration
style so a site's posts look like one family.

## One subject, one post

A site never carries two posts on the same subject — the same main search
query — however differently they are titled or angled. Two pages on one search
compete with each other, and a duplicate that is already live is a bug.

- **Check before writing, not after.** Before a post is drafted, its topic is
  checked against everything the site has or is about to have: the live
  sitemap (it lists posts rendered from code too), the repo's posts folder,
  open PRs, and drafts waiting in the hub's library. If the subject is
  covered, improve the existing post instead of writing a new one. The SEO
  Machine runs this check when it plans a week, again right before it writes,
  and again on the finished draft before it opens a PR — and it writes
  nothing when the check can't run.
- **Live duplicates are folded.** Keep the stronger post (more Search Console
  clicks, then impressions, then the better post), redirect the other's
  address permanently (308, one hop) to it, and drop it from the sitemap.
- **One post per date.** No two posts on a site share a publish date. A post
  whose day is taken waits for the next free day; dates are never invented or
  back-dated to make room. (Dated news editions, like a market brief published
  three times a day, are not articles and are exempt.)

## Markdown contract

This is exactly what the SEO Machine writes. A renderer that supports all of it
can carry the marker line.

**Front-matter**

```yaml
title: "…"
date: 2026-10-07            # YYYY-MM-DD
summary: "…"                # meta description
tags: ["…", "…"]
category: "…"               # optional, sites with categories
image: /images/blog/<slug>/cover.webp   # cover, site-root path
imageAlt: "…"
standard: v1                # the version this post meets; CI holds it to it
```

A site that already uses another field for its cover (`coverImage`, a slug→photo
map in code) must also read `image`, and `image` wins when both are set.

**Body** (GitHub-flavoured markdown)

- `##` and `###` headings, paragraphs, ordered and unordered lists, bold,
  italic, links.
- GFM tables (`| a | b |` with a header row).
- Callouts as blockquotes whose first line is bold:

  ```markdown
  > **Key takeaways**
  > - …
  > - …
  ```

- Images with a caption in the title:
  `![Alt text](/images/blog/<slug>/fig-1.webp "Caption shown under the image")`
  renders as `<figure><img alt="Alt text" …><figcaption>Caption…</figcaption></figure>`.
- Animated visuals use the same syntax with a video file:
  `![Alt](/images/blog/<slug>/loop.mp4 "Caption")` renders as a muted,
  looping, autoplaying, inline video (`muted loop autoplay playsinline`).

**Files**: `public/images/blog/<slug>/cover-<hash>.webp`, `fig-1-<hash>.webp`,
… served from `/images/blog/<slug>/…`. A repo with a different public root
documents its own path here and in the SEO Machine's brand config.

## What the renderer must do

- **Images**: responsive, lazy-loaded (the cover is eager), with an explicit
  aspect ratio so nothing shifts while loading. Styled to the site's design
  system, with the caption under the image.
- **Tables**: styled to the site, a distinct header row, horizontal scroll on
  small screens instead of breaking the layout.
- **Callouts**: a blockquote starting with a bold line is visibly a callout
  (tinted background, accent border), not a plain quote.
- **Motion**: figures, tables and callouts fade and slide in (≤400 ms) as they
  enter the viewport. No motion at all under `prefers-reduced-motion: reduce`.
- **Cover**: front-matter `image` is the hero and the `og:image`. Old posts
  without it keep whatever they did before.
- **Reading time**: shown near the title (words ÷ 225, rounded up).
- **Old posts** render exactly as before.
