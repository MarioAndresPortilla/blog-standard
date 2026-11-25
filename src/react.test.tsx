import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { PostBody } from "./react";

const md = `# Duplicate Title

> **Key takeaways**
> - Depth decides downtime.

## Light peels

### Who they suit

Read the [guide](/services) or [Mayo Clinic](https://www.mayoclinic.org) &amp; more.

| Peel | Downtime |
| :--- | ---: |
| Light | 1 day |

![A peel being applied](/images/blog/p/figure-1.webp "Light peels lift the surface")

> A plain quote.

<script>alert("x")</script>
`;

test("every element of the standard renders, and nothing it shouldn't", () => {
  const html = renderToStaticMarkup(<PostBody markdown={md} />);
  assert.doesNotMatch(html, /Duplicate Title/, "a leading H1 is dropped; the page prints the title");
  assert.match(html, /<div role="note"><p>Key takeaways<\/p><ul><li>Depth decides downtime\.<\/li><\/ul><\/div>/);
  assert.match(html, /<h2>Light peels<\/h2>/);
  assert.match(html, /<h3>Who they suit<\/h3>/);
  assert.match(html, /<a href="\/services">guide<\/a>/);
  assert.match(html, /<a href="https:\/\/www\.mayoclinic\.org" target="_blank" rel="noopener noreferrer">Mayo Clinic<\/a>/);
  assert.match(html, / &amp; more/, "entities decoded once, re-escaped once by React");
  assert.match(html, /<th scope="col" style="text-align:left">Peel<\/th>/);
  assert.match(html, /<td style="text-align:right">1 day<\/td>/);
  assert.match(html, /<figure><img src="\/images\/blog\/p\/figure-1\.webp" alt="A peel being applied" width="1536" height="1024"[^>]*\/><figcaption>Light peels lift the surface<\/figcaption><\/figure>/);
  assert.match(html, /<blockquote><p>A plain quote\.<\/p><\/blockquote>/);
  assert.doesNotMatch(html, /<script/, "raw HTML is dropped, never rendered");
});

test("a site's own components and theme are used", () => {
  const html = renderToStaticMarkup(
    <PostBody
      markdown={"## H\n\n![x](/a.webp \"cap\")\n\n[l](/p)"}
      theme={{ h2: "serif", figure: "fig", figcaption: "cap", media: "media" }}
      components={{
        Image: ({ src, alt, className }) => <span data-img={src} data-alt={alt} className={className} />,
        Link: ({ href, children }) => <span data-link={href}>{children}</span>,
        Reveal: ({ children }) => <section data-reveal="">{children}</section>,
      }}
    />,
  );
  assert.match(html, /<h2 class="serif">H<\/h2>/);
  assert.match(html, /<section data-reveal=""><figure class="fig"><span data-img="\/a\.webp" data-alt="x" class="media"><\/span><figcaption class="cap">cap<\/figcaption><\/figure><\/section>/);
  assert.match(html, /<span data-link="\/p">l<\/span>/);
});

test("a video figure renders as a muted inline video", () => {
  const html = renderToStaticMarkup(<PostBody markdown={'![Clip](/v/clip.mp4 "cap")'} />);
  assert.match(html, /<video src="\/v\/clip\.mp4" aria-label="Clip"[^>]*muted=""[^>]*playsInline=""|<video[^>]*src="\/v\/clip\.mp4"/);
});

test("with `cite`, figures and tables are numbered and offer snippets, and the post ends with a cite box", () => {
  const cite = { url: "https://www.example.com/blog/peels", title: "Peels", site: "Example", date: "2026-11-25" };
  const body = [
    "> **Key takeaways**\n> - One.",
    '![First](/f1.webp "One")',
    "| A | B |\n| - | - |\n| 1 | 2 |",
    '> **A callout with a figure**\n>\n> ![Second](/f2.webp "Two")',
    "![Clip](/v/clip.mp4)",
  ].join("\n\n");
  const html = renderToStaticMarkup(<PostBody markdown={body} cite={cite} />);
  assert.match(html, /<figure id="figure-1">/);
  assert.match(html, /<figure id="figure-2">/, "a figure inside a callout counts, in reading order");
  assert.match(html, /<figure id="figure-3"><video/);
  assert.equal((html.match(/Use this image/g) ?? []).length, 2, "embed code for still images, not the clip");
  assert.match(html, /<div id="table-1" tabindex="0" role="region"/i);
  assert.match(html, /<summary>Cite this table<\/summary><pre style="white-space:pre-wrap;word-break:break-all;user-select:all"><code>Source: &lt;a href=&quot;https:\/\/www\.example\.com\/blog\/peels#table-1&quot;&gt;/);
  assert.match(html, /src=&quot;https:\/\/www\.example\.com\/f1\.webp&quot;/, "embed code uses an absolute image URL");
  assert.match(html, /<aside aria-label="Cite or link to this article"><details><summary>Cite or link to this article<\/summary>/);
  assert.match(html, /Example\. \(2026, November 25\)\. Peels\. https:\/\/www\.example\.com\/blog\/peels/);
  assert.ok(html.trimEnd().endsWith("</aside>"), "the box comes last");
});

test("without `cite` nothing changes; citeBox={false} leaves the box to the site", () => {
  const plain = renderToStaticMarkup(<PostBody markdown={"![x](/a.webp)\n\n| A |\n| - |\n| 1 |"} />);
  assert.doesNotMatch(plain, /id="figure-|id="table-|<details|<aside/);
  const cite = { url: "https://x.com/p", title: "P", site: "X" };
  const noBox = renderToStaticMarkup(<PostBody markdown="![x](/a.webp)" cite={cite} citeBox={false} />);
  assert.match(noBox, /Use this image/);
  assert.doesNotMatch(noBox, /<aside/);
});

test("labels can be translated", () => {
  const cite = { url: "https://x.com/p", title: "P", site: "X", labels: { image: "Usar esta imagen", article: "Citar este artículo" } };
  const html = renderToStaticMarkup(<PostBody markdown="![x](/a.webp)" cite={cite} />);
  assert.match(html, /<summary>Usar esta imagen<\/summary>/);
  assert.match(html, /aria-label="Citar este artículo"/);
});
