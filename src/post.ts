// A blog post file as the standard defines it (BLOG_STANDARD.md → "Markdown
// contract"): YAML front-matter, then a GitHub-flavoured markdown body.

import matter from "gray-matter";
import { z } from "zod";

// `date` arrives as a string ("2026-10-13") or, when YAML reads it unquoted, a Date.
const isoDay = z.union([z.string(), z.date()]).transform((v, ctx) => {
  const s = v instanceof Date ? v.toISOString().slice(0, 10) : v.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s))) {
    ctx.addIssue({ code: "custom", message: `date must be YYYY-MM-DD, got "${String(v)}"` });
    return z.NEVER;
  }
  return s;
});

const sitePath = z
  .string()
  .refine((s) => s.startsWith("/") || /^https?:\/\//.test(s), "must be a site-root path (/images/...) or an absolute URL");

/** The front-matter every post carries. Unknown keys are kept, not rejected — sites add their own. */
export const frontMatterSchema = z
  .object({
    title: z.string().trim().min(1, "title is required"),
    date: isoDay,
    summary: z.string().trim().min(1, "summary is required"),
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
    image: sitePath.optional(),
    imageAlt: z.string().optional(),
    coverSubject: z.string().optional(),
    type: z.string().optional(),
  })
  .passthrough();

export type FrontMatter = z.infer<typeof frontMatterSchema>;

export interface Post {
  slug: string;
  frontMatter: FrontMatter;
  /** The body, front-matter removed. */
  markdown: string;
}

export type ParseResult = { ok: true; post: Post } | { ok: false; slug: string; errors: string[] };

/** A slug is the filename: lowercase words joined by single hyphens, at most 80 characters. */
export function slugProblem(slug: string): string | null {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return `slug "${slug}" must be lowercase words joined by single hyphens`;
  if (slug.length > 80) return `slug "${slug}" is ${slug.length} characters; keep it under 80`;
  return null;
}

/** Parse one post file. Never throws: a malformed file comes back as errors. */
export function parsePost(slug: string, raw: string): ParseResult {
  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(raw);
  } catch (err) {
    return { ok: false, slug, errors: [`front-matter is not valid YAML: ${(err as Error).message.split("\n")[0]}`] };
  }
  const fm = frontMatterSchema.safeParse(parsed.data);
  const errors = fm.success ? [] : fm.error.issues.map((i) => `${i.path.join(".") || "front-matter"}: ${i.message}`);
  const slugIssue = slugProblem(slug);
  if (slugIssue) errors.push(slugIssue);
  if (!fm.success || errors.length) return { ok: false, slug, errors };
  return { ok: true, post: { slug, frontMatter: fm.data, markdown: parsed.content.trim() } };
}

/** Site-root image paths a post refers to — its cover and every body image — for existence checks. */
export function localImagePaths(post: Post): string[] {
  const paths = new Set<string>();
  if (post.frontMatter.image?.startsWith("/")) paths.add(post.frontMatter.image);
  for (const m of post.markdown.matchAll(/!\[[^\]]*\]\((\/[^)\s]+)(?:\s+"[^"]*")?\)/g)) paths.add(m[1]);
  return [...paths];
}
