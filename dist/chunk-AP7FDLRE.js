// src/cite.ts
var CITE_LABELS = {
  image: "Use this image",
  table: "Cite this table",
  article: "Cite or link to this article",
  link: "Link (HTML)",
  citation: "Citation",
  source: "Source"
};
var HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}
function absoluteUrl(href, base) {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}
function anchorUrl(cite, anchor) {
  return `${cite.url.replace(/#.*$/, "")}#${anchor}`;
}
var figureId = (n) => `figure-${n}`;
var tableId = (n) => `table-${n}`;
function citeLabels(cite) {
  return { ...CITE_LABELS, ...cite.labels };
}
function credit(cite, href) {
  const labels = citeLabels(cite);
  return `${escapeHtml(labels.source)}: <a href="${escapeHtml(href)}">${escapeHtml(cite.title)}</a> \u2014 ${escapeHtml(cite.site)}`;
}
function imageEmbed(cite, image) {
  const href = anchorUrl(cite, figureId(image.n));
  const src = absoluteUrl(image.src, cite.url);
  return `<a href="${escapeHtml(href)}"><img src="${escapeHtml(src)}" alt="${escapeHtml(image.alt)}" width="768" loading="lazy"></a><br>${credit(cite, href)}`;
}
function tableCredit(cite, n) {
  return credit(cite, anchorUrl(cite, tableId(n)));
}
function articleLink(cite) {
  return `<a href="${escapeHtml(cite.url)}">${escapeHtml(cite.title)}</a>`;
}
function citeDate(date, locale = "en-US") {
  const m = date?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const at = new Date(Date.UTC(year, month - 1, day));
  if (at.getUTCMonth() !== month - 1 || at.getUTCDate() !== day) return null;
  const opts = { month: "long", day: "numeric", timeZone: "UTC" };
  let dayMonth;
  try {
    dayMonth = new Intl.DateTimeFormat(locale, opts).format(at);
  } catch {
    dayMonth = new Intl.DateTimeFormat("en-US", opts).format(at);
  }
  return `${m[1]}, ${dayMonth}`;
}
function citation(cite) {
  const author = cite.author?.trim() || cite.site;
  const when = citeDate(cite.date, cite.locale) ?? "n.d.";
  const site = author === cite.site ? "" : ` ${cite.site}.`;
  const title = /[.?!]$/.test(cite.title.trim()) ? cite.title.trim() : `${cite.title.trim()}.`;
  return `${author}. (${when}). ${title}${site} ${cite.url}`;
}

export {
  CITE_LABELS,
  escapeHtml,
  absoluteUrl,
  anchorUrl,
  figureId,
  tableId,
  citeLabels,
  imageEmbed,
  tableCredit,
  articleLink,
  citation
};
