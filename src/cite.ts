// Cite and embed: the snippets a reader copies to credit a post — an image's
// embed code, a table's source line, the article's link and citation. Each
// one carries a plain link back to the post, which is how a post's figures and
// data earn links from the sites that reuse them.
//
// Pure strings, no React, so the renderer (react.tsx) and any site page can
// use them. Every value that goes into a snippet's HTML is escaped here.

export interface CiteLabels {
  /** Under each figure: "Use this image". */
  image: string;
  /** Under each table: "Cite this table". */
  table: string;
  /** The box after the post: "Cite or link to this article". */
  article: string;
  /** The box's HTML-link row: "Link (HTML)". */
  link: string;
  /** The box's citation row: "Citation". */
  citation: string;
  /** The word before the credit in an image/table snippet: "Source". */
  source: string;
}

export const CITE_LABELS: CiteLabels = {
  image: "Use this image",
  table: "Cite this table",
  article: "Cite or link to this article",
  link: "Link (HTML)",
  citation: "Citation",
  source: "Source",
};

export interface PostCite {
  /** The post's canonical, absolute URL: "https://www.example.com/blog/slug". */
  url: string;
  /** The post's title. */
  title: string;
  /** The site's name as it should be credited: "BuyOrBeSold". */
  site: string;
  /** Publish date, YYYY-MM-DD (a timestamp's day is used). Left out of the citation when missing. */
  date?: string;
  /** Who to credit as author. Default: the site. */
  author?: string;
  /** Translated or reworded labels. */
  labels?: Partial<CiteLabels>;
}

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escapes text for HTML content or a quoted attribute. */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

/** `href` resolved against `base` (a relative image path becomes absolute); `href` itself if either is unusable. */
export function absoluteUrl(href: string, base: string): string {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

/** The post's URL with `#anchor`, replacing any fragment it already has. */
export function anchorUrl(cite: PostCite, anchor: string): string {
  return `${cite.url.replace(/#.*$/, "")}#${anchor}`;
}

export const figureId = (n: number) => `figure-${n}`;
export const tableId = (n: number) => `table-${n}`;

export function citeLabels(cite: PostCite): CiteLabels {
  return { ...CITE_LABELS, ...cite.labels };
}

/** The credit line every snippet ends with: `Source: <a href="…">Title</a> — Site`. */
function credit(cite: PostCite, href: string): string {
  const labels = citeLabels(cite);
  return `${escapeHtml(labels.source)}: <a href="${escapeHtml(href)}">${escapeHtml(cite.title)}</a> — ${escapeHtml(cite.site)}`;
}

/** Embed code for figure `n`: the image, linked to the figure in the post, and the credit. */
export function imageEmbed(cite: PostCite, image: { src: string; alt: string; n: number }): string {
  const href = anchorUrl(cite, figureId(image.n));
  const src = absoluteUrl(image.src, cite.url);
  return (
    `<a href="${escapeHtml(href)}"><img src="${escapeHtml(src)}" alt="${escapeHtml(image.alt)}" width="768" loading="lazy"></a>` +
    `<br>${credit(cite, href)}`
  );
}

/** The source line for table `n`, linked to the table in the post. */
export function tableCredit(cite: PostCite, n: number): string {
  return credit(cite, anchorUrl(cite, tableId(n)));
}

/** A plain HTML link to the post. */
export function articleLink(cite: PostCite): string {
  return `<a href="${escapeHtml(cite.url)}">${escapeHtml(cite.title)}</a>`;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2026, November 25" from "2026-11-25" (or a timestamp on that day); null when it isn't a date. */
function citeDate(date: string | undefined): string | null {
  const m = date?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const month = MONTHS[Number(m[2]) - 1];
  const day = Number(m[3]);
  return month && day >= 1 && day <= 31 ? `${m[1]}, ${month} ${day}` : null;
}

/**
 * The post as a reference-list citation (APA style, plain text):
 * `Author. (2026, November 25). Title. Site. https://…` — the site is named
 * once when it is also the author, and an unknown date reads "(n.d.)".
 */
export function citation(cite: PostCite): string {
  const author = cite.author?.trim() || cite.site;
  const when = citeDate(cite.date) ?? "n.d.";
  const site = author === cite.site ? "" : ` ${cite.site}.`;
  const title = /[.?!]$/.test(cite.title.trim()) ? cite.title.trim() : `${cite.title.trim()}.`;
  return `${author}. (${when}). ${title}${site} ${cite.url}`;
}
