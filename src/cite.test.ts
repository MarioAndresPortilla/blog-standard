import { test } from "node:test";
import assert from "node:assert/strict";
import { absoluteUrl, anchorUrl, articleLink, citation, escapeHtml, imageEmbed, tableCredit, type PostCite } from "./cite";

const cite: PostCite = {
  url: "https://www.example.com/blog/peels",
  title: 'Peels "light" & deep <guide>',
  site: "Example Skin",
  date: "2026-11-25",
};

test("every value in a snippet is escaped", () => {
  assert.equal(escapeHtml(`<a href="x">'&'</a>`), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  assert.equal(articleLink(cite), '<a href="https://www.example.com/blog/peels">Peels &quot;light&quot; &amp; deep &lt;guide&gt;</a>');
});

test("an image embed links the figure back to the post, with an absolute src and a credit", () => {
  const html = imageEmbed(cite, { src: "/images/blog/peels/figure-2.webp", alt: 'A "peel"', n: 2 });
  assert.equal(
    html,
    '<a href="https://www.example.com/blog/peels#figure-2"><img src="https://www.example.com/images/blog/peels/figure-2.webp" alt="A &quot;peel&quot;" width="768" loading="lazy"></a>' +
      '<br>Source: <a href="https://www.example.com/blog/peels#figure-2">Peels &quot;light&quot; &amp; deep &lt;guide&gt;</a> — Example Skin',
  );
  assert.match(imageEmbed(cite, { src: "https://cdn.example.net/a.webp", alt: "", n: 1 }), /src="https:\/\/cdn\.example\.net\/a\.webp"/, "an absolute src is kept");
});

test("a table credit points at the table", () => {
  assert.match(tableCredit(cite, 3), /^Source: <a href="https:\/\/www\.example\.com\/blog\/peels#table-3">/);
  assert.match(tableCredit({ ...cite, labels: { source: "Fuente" } }, 1), /^Fuente: /);
});

test("anchors replace a fragment the URL already has; bad URLs fall back", () => {
  assert.equal(anchorUrl({ ...cite, url: "https://x.com/p#top" }, "table-1"), "https://x.com/p#table-1");
  assert.equal(absoluteUrl("/a.webp", "not a url"), "/a.webp");
});

test("the citation names the site once, dates the day, and survives a missing date", () => {
  assert.equal(citation(cite), 'Example Skin. (2026, November 25). Peels "light" & deep <guide>. https://www.example.com/blog/peels');
  assert.equal(
    citation({ ...cite, title: "Is gold a hedge?", author: "Dana Lee", date: "2026-03-02T13:00:00Z" }),
    "Dana Lee. (2026, March 2). Is gold a hedge? Example Skin. https://www.example.com/blog/peels",
  );
  assert.match(citation({ ...cite, date: undefined }), /\(n\.d\.\)/);
  assert.match(citation({ ...cite, date: "soon" }), /\(n\.d\.\)/);
});
