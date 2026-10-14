# @seo-machine/blog-standard

Blog standard v1 as code: the post format, its checks, and one React renderer,
shared by the SEO Machine and every client site that publishes its posts.
The full rules are in `BLOG_STANDARD.md`.

## In a client site

Install a released version straight from GitHub (no registry, no login):

```bash
npm install "github:MarioAndresPortilla/blog-standard#v1.0.0"
```

which adds `"@seo-machine/blog-standard": "github:MarioAndresPortilla/blog-standard#v1.0.0"`
to `package.json`. To upgrade, change the tag. Releases are listed under
[Tags](https://github.com/MarioAndresPortilla/blog-standard/tags).

**Check posts in CI.** Exits 1 when a post would render wrong.

```bash
npx --no-install blog-standard check content/blog --public public --since 2026-10-07
```

`--since`: posts dated on or after this must meet the full standard (older
posts are only checked for valid front-matter and working images).
`--legacy a,b`: slugs exempt from the full standard.
`--marked`: only posts whose front-matter declares `standard: v1` must meet the
full standard (the SEO Machine marks every post it writes). Use it instead of
`--since`/`--legacy` when a site's hand-written posts can't be told apart by
date. A declared post is held to the standard in every mode.

**Render a post** with the site's own image, link and styles:

```tsx
import { PostBody } from "@seo-machine/blog-standard/react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

<PostBody
  markdown={post.markdown}
  figureSizes="(max-width: 768px) 100vw, 620px"
  components={{ Image: (p) => <Image {...p} />, Link: ({ href, children }) => <Link href={href}>{children}</Link> }}
  theme={{ h2: "font-serif text-2xl mt-14 mb-4", p: "mb-5 leading-relaxed", callout: "border-l-4 pl-6 my-10" }}
/>
```

**Read posts:**

```ts
import { parsePost } from "@seo-machine/blog-standard";
const result = parsePost(slug, rawFileContents); // { ok, post } or { ok: false, errors }
```

## Releasing

Actions → **Release** → Run workflow → enter the version (e.g. `1.1.0`). It
tests, builds, and pushes a `v1.1.0` tag whose commit includes the built files.
