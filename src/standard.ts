// The blog standard (docs/BLOG_STANDARD.md), as checks the machine can run.
//
// Posts used to be 2,000-word walls of text: no pictures, no tables, a ten-minute
// read nobody finished. The standard makes every post short and visual, and this
// is the part of it a program can verify. A draft that misses any of it is held,
// whatever the reviewer scored it — the reviewer judges the writing, this judges
// the shape, and a well-written wall of text is still a wall of text.

export const STANDARD_VERSION = "v1";
/** The line a client repo's BLOG_STANDARD.md carries once its renderer supports all of this. */
export const STANDARD_MARKER = `blog-standard: ${STANDARD_VERSION}`;

/** What the template asks for. */
export const TARGET_WORDS = 1000;
/** Below this the post is too thin to be worth a reader's click. */
export const MIN_WORDS = 700;
/** Above this it is the ten-minute read the standard exists to stop. */
export const MAX_WORDS = 1400;
export const MIN_FIGURES = 2;
/** Figures past this are dropped at publish, not generated: each one costs an image call. */
export const MAX_FIGURES = 3;

export interface Figure {
  alt: string;
  caption: string;
  /** What the illustrator should draw. Never shown to readers. */
  brief: string;
}

// The template asks for each inline visual as one line:
//   [[figure: alt text | caption | what to draw]]
// The publisher swaps each for a generated image. The reviewer is told these
// are slots, not leftovers (see lib/review.ts).
const FIGURE_LINE = /^[ \t]*\[\[figure:([^\]]*)\]\][ \t]*$/gim;

export function findFigures(body: string): Figure[] {
  const out: Figure[] = [];
  for (const m of body.matchAll(FIGURE_LINE)) {
    const [alt, caption, ...brief] = m[1].split("|").map((s) => s.trim());
    // A slot with nothing to draw can't be filled; it is dropped at publish.
    if (alt && brief.join(" ").trim()) out.push({ alt, caption: caption ?? "", brief: brief.join(" | ").trim() });
  }
  return out;
}

/**
 * Replace the first MAX_FIGURES slots with real images, in order, and remove
 * any slot left over. `srcs[i]` is the site path for figure i.
 */
export function placeFigures(body: string, srcs: string[]): string {
  let i = 0;
  return body
    .replace(FIGURE_LINE, (line) => {
      const [fig] = findFigures(line);
      if (!fig || i >= Math.min(srcs.length, MAX_FIGURES)) return "";
      const src = srcs[i++];
      return `![${escapeAlt(fig.alt)}](${src}${fig.caption ? ` "${fig.caption.replace(/"/g, "'")}"` : ""})`;
    })
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

function escapeAlt(alt: string): string {
  return alt.replace(/[[\]]/g, "");
}

/**
 * A GFM table's divider row: every cell is hyphens with optional alignment
 * colons (`---`, `:--`, `-:`, `:-:`), cells separated by pipes. One hyphen is
 * enough — exactly what the renderer (marked) accepts, so the checker can't
 * fail a table the page displays. At least one pipe is required, so a list
 * item like "- item" never reads as one.
 */
const DIVIDER_SOURCE = String.raw`^\s*\|?(?:\s*:?-+:?\s*\|)+(?:\s*:?-+:?\s*)?$`;
const TABLE_DIVIDER = new RegExp(DIVIDER_SOURCE);
const TABLE_DIVIDER_GLOBAL = new RegExp(DIVIDER_SOURCE, "gm");

/** Body words a reader actually reads: no markup, no image slots, no URLs. */
export function countWords(body: string): number {
  const text = body
    .replace(FIGURE_LINE, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\]\([^)]*\)/g, "]") // keep link text, drop the URL
    .replace(TABLE_DIVIDER_GLOBAL, " ") // table divider rows
    .replace(/[#>*_`|[\]-]/g, " ");
  return (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’]*/gu) ?? []).length;
}

function countTables(body: string): number {
  const lines = body.split("\n");
  let n = 0;
  for (let i = 1; i < lines.length; i++) {
    if (TABLE_DIVIDER.test(lines[i]) && lines[i - 1].includes("|")) n++;
  }
  return n;
}

function countImages(body: string): number {
  return findFigures(body).length + (body.match(/!\[[^\]]*\]\([^)]+\)/g) ?? []).length;
}

const TAKEAWAYS = /^\s*>\s*\*\*\s*key takeaways?\s*:?\s*\*\*/im;

export interface StandardCheck {
  words: number;
  figures: number;
  tables: number;
  takeaways: boolean;
  /** Empty when the draft meets the standard. Each one is a hold reason. */
  problems: string[];
}

export function checkStandard(body: string): StandardCheck {
  const words = countWords(body);
  const figures = countImages(body);
  const tables = countTables(body);
  const takeaways = TAKEAWAYS.test(body);
  const problems: string[] = [];
  if (words > MAX_WORDS) problems.push(`${words} words — the blog standard caps a post at ${MAX_WORDS} (aim for 800–1,200).`);
  if (words < MIN_WORDS) problems.push(`${words} words — under the blog standard's ${MIN_WORDS}-word floor.`);
  if (figures < MIN_FIGURES) problems.push(`${figures} inline visual${figures === 1 ? "" : "s"} — the blog standard needs at least ${MIN_FIGURES}.`);
  if (tables < 1) problems.push("No table — the blog standard needs at least one.");
  if (!takeaways) problems.push('No "Key takeaways" callout near the top — the blog standard needs one.');
  return { words, figures, tables, takeaways, problems };
}

/** Reading time in minutes, as a site shows it: body words ÷ 225, rounded up, at least 1. */
export function readingMinutes(body: string): number {
  return Math.max(1, Math.ceil(countWords(body) / 225));
}
