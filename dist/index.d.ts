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

export { type CheckOptions, type CheckReport, type Figure, type FrontMatter, MAX_FIGURES, MAX_WORDS, MIN_FIGURES, MIN_WORDS, type ParseResult, type Post, type PostReport, STANDARD_MARKER, STANDARD_VERSION, type StandardCheck, TARGET_WORDS, checkPosts, checkSite, checkStandard, countWords, findFigures, formatReport, frontMatterSchema, localImagePaths, parsePost, placeFigures, readingMinutes, slugProblem };
