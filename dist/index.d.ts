import { z } from 'zod';

declare const STANDARD_VERSION = "v1";
/** The line a client repo's BLOG_STANDARD.md carries once its renderer supports all of this. */
declare const STANDARD_MARKER = "blog-standard: v1";
/** What the template asks for. */
declare const TARGET_WORDS = 1000;
/** Below this the post is too thin to be worth a reader's click. */
declare const MIN_WORDS = 700;
/** Above this it is the ten-minute read the standard exists to stop. */
declare const MAX_WORDS = 1400;
declare const MIN_FIGURES = 2;
/** Figures past this are dropped at publish, not generated: each one costs an image call. */
declare const MAX_FIGURES = 3;
interface Figure {
    alt: string;
    caption: string;
    /** What the illustrator should draw. Never shown to readers. */
    brief: string;
}
declare function findFigures(body: string): Figure[];
/**
 * Replace the first MAX_FIGURES slots with real images, in order, and remove
 * any slot left over. `srcs[i]` is the site path for figure i.
 */
declare function placeFigures(body: string, srcs: string[]): string;
/** Body words a reader actually reads: no markup, no image slots, no URLs. */
declare function countWords(body: string): number;
interface StandardCheck {
    words: number;
    figures: number;
    tables: number;
    takeaways: boolean;
    /** Empty when the draft meets the standard. Each one is a hold reason. */
    problems: string[];
}
declare function checkStandard(body: string): StandardCheck;
/** Reading time in minutes, as a site shows it: body words ÷ 225, rounded up, at least 1. */
declare function readingMinutes(body: string): number;

/** The front-matter every post carries. Unknown keys are kept, not rejected — sites add their own. */
declare const frontMatterSchema: z.ZodObject<{
    title: z.ZodString;
    date: z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodDate]>, z.ZodTransform<string, string | Date>>;
    summary: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    category: z.ZodOptional<z.ZodString>;
    image: z.ZodOptional<z.ZodString>;
    imageAlt: z.ZodOptional<z.ZodString>;
    coverSubject: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodString>;
    standard: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
type FrontMatter = z.infer<typeof frontMatterSchema>;
interface Post {
    slug: string;
    frontMatter: FrontMatter;
    /** The body, front-matter removed. */
    markdown: string;
}
type ParseResult = {
    ok: true;
    post: Post;
} | {
    ok: false;
    slug: string;
    errors: string[];
};
/** A slug is the filename: lowercase words joined by single hyphens, at most 80 characters. */
declare function slugProblem(slug: string): string | null;
/** Parse one post file. Never throws: a malformed file comes back as errors. */
declare function parsePost(slug: string, raw: string): ParseResult;
/** Site-root image paths a post refers to — its cover and every body image — for existence checks. */
declare function localImagePaths(post: Post): string[];

interface CheckOptions {
    /** Folder of `<slug>.md` posts, e.g. "content/blog". */
    postsDir: string;
    /** The site's public folder, to check that referenced images exist. Omit to skip. */
    publicDir?: string;
    /**
     * Posts dated on or after this day (YYYY-MM-DD) must meet the full standard
     * (length, figures, table, takeaways). Older posts predate it and are only
     * checked for a valid file and working images. Omit to check every post.
     */
    since?: string;
    /** Slugs exempt from the full standard regardless of date (legacy posts). */
    legacy?: string[];
    /**
     * Hold only posts that declare `standard:` in their front-matter to the full
     * standard; every other post is checked for a valid file and working images
     * only. For a site whose hand-written posts can't be told apart by date —
     * instead of listing them in `legacy`. (A declared post is held in every
     * mode: a post that says it meets the standard must.)
     */
    marked?: boolean;
}
interface PostReport {
    slug: string;
    errors: string[];
}
interface CheckReport {
    checked: number;
    failed: PostReport[];
    ok: boolean;
}
declare function checkPosts(posts: {
    slug: string;
    raw: string;
}[], opts?: Omit<CheckOptions, "postsDir">): CheckReport;
/** Read every `<slug>.md` under `postsDir` and check it. */
declare function checkSite(opts: CheckOptions): CheckReport;
/** The report as lines a person reads in a CI log. */
declare function formatReport(r: CheckReport): string;

declare const DEFAULT_HUB = "https://seo-machine-bay.vercel.app";
interface HubOptions {
    /** This site's id in the hub (its brand id, e.g. "360-radiance"). */
    site: string;
    /** The hub's base URL. Default: the SEO Machine's production hub. */
    hub?: string;
    /** Seconds a fetched copy stays fresh in Next.js's data cache. Default 300. */
    revalidate?: number;
    /** For tests, or a non-Next runtime. */
    fetch?: typeof fetch;
}
/** Every published post the hub has for this site, newest first. [] if it can't be reached. */
declare function hubPosts(opts: HubOptions): Promise<Post[]>;
/** One published post by slug, or null (not in the hub, or the hub can't be reached). */
declare function hubPost(opts: HubOptions & {
    slug: string;
}): Promise<Post | null>;
/**
 * A site's own post files and its hub posts as one list, newest first.
 *
 * The site's FILE wins a shared slug: the hub's copy of a post that is also a
 * file was imported from it, and keeps only the shared fields — a site's own
 * front-matter (custom keys, a cover map) lives in the file. The hub adds the
 * posts the site doesn't have: what the machine and the client publish there.
 * To hand an existing post over to the hub, delete its file.
 */
declare function mergePosts(local: Post[], hub: Post[]): Post[];

export { type CheckOptions, type CheckReport, DEFAULT_HUB, type Figure, type FrontMatter, type HubOptions, MAX_FIGURES, MAX_WORDS, MIN_FIGURES, MIN_WORDS, type ParseResult, type Post, type PostReport, STANDARD_MARKER, STANDARD_VERSION, type StandardCheck, TARGET_WORDS, checkPosts, checkSite, checkStandard, countWords, findFigures, formatReport, frontMatterSchema, hubPost, hubPosts, localImagePaths, mergePosts, parsePost, placeFigures, readingMinutes, slugProblem };
