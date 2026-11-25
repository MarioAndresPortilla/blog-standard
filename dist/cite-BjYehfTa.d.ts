interface CiteLabels {
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
declare const CITE_LABELS: CiteLabels;
interface PostCite {
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
    /** The page's language, for the citation's date: "es" → "2026, 18 de noviembre". Default "en-US". */
    locale?: string;
    /** Translated or reworded labels. */
    labels?: Partial<CiteLabels>;
}
/** Escapes text for HTML content or a quoted attribute. */
declare function escapeHtml(text: string): string;
/** `href` resolved against `base` (a relative image path becomes absolute); `href` itself if either is unusable. */
declare function absoluteUrl(href: string, base: string): string;
/** The post's URL with `#anchor`, replacing any fragment it already has. */
declare function anchorUrl(cite: PostCite, anchor: string): string;
declare const figureId: (n: number) => string;
declare const tableId: (n: number) => string;
declare function citeLabels(cite: PostCite): CiteLabels;
/** Embed code for figure `n`: the image, linked to the figure in the post, and the credit. */
declare function imageEmbed(cite: PostCite, image: {
    src: string;
    alt: string;
    n: number;
}): string;
/** The source line for table `n`, linked to the table in the post. */
declare function tableCredit(cite: PostCite, n: number): string;
/** A plain HTML link to the post. */
declare function articleLink(cite: PostCite): string;
/**
 * The post as a reference-list citation (APA style, plain text):
 * `Author. (2026, November 25). Title. Site. https://…` — the site is named
 * once when it is also the author, and an unknown date reads "(n.d.)".
 */
declare function citation(cite: PostCite): string;

export { CITE_LABELS as C, type PostCite as P, type CiteLabels as a, absoluteUrl as b, anchorUrl as c, articleLink as d, citation as e, citeLabels as f, escapeHtml as g, figureId as h, imageEmbed as i, tableId as j, tableCredit as t };
