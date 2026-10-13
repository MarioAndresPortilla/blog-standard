// <PostBody>: renders a blog-standard post body. One renderer for every client
// site, so a post the SEO Machine writes looks the same everywhere it's allowed
// to look the same, and differs only where a site styles it.
//
// Built from 360 Radiance's renderer. Tokens from `marked` are rendered straight
// to React rather than through marked's HTML output, so there is no HTML
// injection path — raw HTML in a post is dropped, never rendered.
//
// A site plugs in what's framework- or brand-specific:
//   components — Image (e.g. next/image), Link (e.g. a locale-aware Link),
//                Video, Reveal (a scroll-in animation wrapper)
//   theme      — a class name per element (Tailwind or anything else)
// With neither, it renders plain, accessible HTML.

import { Fragment, type ReactNode } from "react";
import { marked, type Token, type Tokens } from "marked";

/** The standard generates every figure at 1536×1024, so that's the box reserved before it loads. */
export const FIGURE_WIDTH = 1536;
export const FIGURE_HEIGHT = 1024;
const VIDEO = /\.(mp4|webm)(?:[?#]|$)/i;

export interface ImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  className?: string;
}
export interface LinkProps {
  href: string;
  className?: string;
  children: ReactNode;
}
export interface VideoProps {
  src: string;
  label: string;
  width: number;
  height: number;
  className?: string;
}

export interface PostBodyComponents {
  Image?: (props: ImageProps) => ReactNode;
  Link?: (props: LinkProps) => ReactNode;
  Video?: (props: VideoProps) => ReactNode;
  Reveal?: (props: { children: ReactNode }) => ReactNode;
}

/** A class name per element. Every key is optional. */
export interface PostBodyTheme {
  p?: string;
  h2?: string;
  h3?: string;
  strong?: string;
  code?: string;
  pre?: string;
  hr?: string;
  link?: string;
  ul?: string;
  ol?: string;
  li?: string;
  quote?: string;
  callout?: string;
  calloutTitle?: string;
  figure?: string;
  media?: string;
  figcaption?: string;
  tableWrap?: string;
  table?: string;
  thead?: string;
  th?: string;
  tr?: string;
  td?: string;
  /** The first cell of each row, usually the row's label. Falls back to `td`. */
  tdFirst?: string;
}

export interface PostBodyProps {
  markdown: string;
  components?: PostBodyComponents;
  theme?: PostBodyTheme;
  /** `sizes` for figure images, e.g. "(max-width: 768px) 100vw, 620px". */
  figureSizes?: string;
}

// marked leaves entities like `&amp;` in text for its own HTML output; React would print them literally.
const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  mdash: "—", ndash: "–", hellip: "…", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] !== "#") return ENTITIES[entity.toLowerCase()] ?? match;
    const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
  });
}

const isExternal = (href: string) => /^https?:\/\//i.test(href);

const defaults: Required<PostBodyComponents> = {
  Image: ({ src, alt, width, height, sizes, className }) => (
    <img src={src} alt={alt} width={width} height={height} sizes={sizes} className={className} loading="lazy" decoding="async" />
  ),
  Link: ({ href, className, children }) =>
    isExternal(href) ? (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ) : (
      <a href={href} className={className}>
        {children}
      </a>
    ),
  Video: ({ src, label, width, height, className }) => (
    <video src={src} aria-label={label} width={width} height={height} className={className} muted loop autoPlay playsInline />
  ),
  Reveal: ({ children }) => <>{children}</>,
};

interface Ctx {
  c: Required<PostBodyComponents>;
  t: PostBodyTheme;
  sizes?: string;
}

function inline(tokens: Token[] | undefined, x: Ctx): ReactNode {
  return tokens?.map((token, i) => <Fragment key={i}>{inlineToken(token, x)}</Fragment>);
}

function inlineToken(token: Token, x: Ctx): ReactNode {
  switch (token.type) {
    case "text":
      return "tokens" in token && token.tokens ? inline(token.tokens, x) : decodeEntities(token.text);
    case "escape":
      return token.text;
    case "strong":
      return <strong className={x.t.strong}>{inline(token.tokens, x)}</strong>;
    case "em":
      return <em>{inline(token.tokens, x)}</em>;
    case "del":
      return <del>{inline(token.tokens, x)}</del>;
    case "codespan":
      return <code className={x.t.code}>{decodeEntities(token.text)}</code>;
    case "br":
      return <br />;
    case "link":
      return (
        <x.c.Link href={token.href} className={x.t.link}>
          {inline(token.tokens, x)}
        </x.c.Link>
      );
    case "image":
      // An image mid-sentence stays in the flow; only one alone in its paragraph is a figure.
      return (
        <x.c.Image
          src={token.href}
          alt={decodeEntities(token.text)}
          width={FIGURE_WIDTH}
          height={FIGURE_HEIGHT}
          sizes={x.sizes}
          className={x.t.media}
        />
      );
    default:
      return null;
  }
}

/** The image of a paragraph that holds nothing else — the standard's figure line. */
function figureImage(tokens: Token[]): Tokens.Image | null {
  const content = tokens.filter((t) => !(t.type === "text" && !t.text.trim()));
  return content.length === 1 && content[0].type === "image" ? (content[0] as Tokens.Image) : null;
}

function Figure({ image, x }: { image: Tokens.Image; x: Ctx }) {
  const alt = decodeEntities(image.text);
  const caption = image.title ? decodeEntities(image.title.trim()) : "";
  return (
    <x.c.Reveal>
      <figure className={x.t.figure}>
        {VIDEO.test(image.href) ? (
          <x.c.Video src={image.href} label={alt} width={FIGURE_WIDTH} height={FIGURE_HEIGHT} className={x.t.media} />
        ) : (
          <x.c.Image src={image.href} alt={alt} width={FIGURE_WIDTH} height={FIGURE_HEIGHT} sizes={x.sizes} className={x.t.media} />
        )}
        {caption && <figcaption className={x.t.figcaption}>{caption}</figcaption>}
      </figure>
    </x.c.Reveal>
  );
}

function Table({ token, x }: { token: Tokens.Table; x: Ctx }) {
  const align = (cell: Tokens.TableCell) => (cell.align ? { textAlign: cell.align } : undefined);
  return (
    <x.c.Reveal>
      {/* Scrolls sideways on a phone instead of squeezing columns; focusable for keyboard users. */}
      <div tabIndex={0} role="region" aria-label="Table" className={x.t.tableWrap} style={{ overflowX: "auto" }}>
        <table className={x.t.table}>
          <thead className={x.t.thead}>
            <tr>
              {token.header.map((cell, i) => (
                <th key={i} scope="col" className={x.t.th} style={align(cell)}>
                  {inline(cell.tokens, x)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {token.rows.map((row, r) => (
              <tr key={r} className={x.t.tr}>
                {row.map((cell, c) => (
                  <td key={c} className={c === 0 ? (x.t.tdFirst ?? x.t.td) : x.t.td} style={align(cell)}>
                    {inline(cell.tokens, x)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </x.c.Reveal>
  );
}

function Quote({ token, x }: { token: Tokens.Blockquote; x: Ctx }) {
  const [first, ...rest] = token.tokens;
  const lead = first?.type === "paragraph" ? (first as Tokens.Paragraph).tokens : [];

  // A blockquote that opens with a bold line is a callout (the standard's
  // `> **Key takeaways**`); a bold line on its own is the callout's title.
  if (lead[0]?.type === "strong") {
    const titled = lead.length === 1;
    return (
      <x.c.Reveal>
        <div role="note" className={x.t.callout}>
          {titled && <p className={x.t.calloutTitle}>{inline((lead[0] as Tokens.Strong).tokens, x)}</p>}
          {blocks(titled ? rest : token.tokens, x)}
        </div>
      </x.c.Reveal>
    );
  }
  return <blockquote className={x.t.quote}>{blocks(token.tokens, x)}</blockquote>;
}

function List({ token, x }: { token: Tokens.List; x: Ctx }) {
  const Tag = token.ordered ? "ol" : "ul";
  const start = token.ordered && typeof token.start === "number" && token.start !== 1 ? token.start : undefined;
  return (
    <Tag start={start} className={token.ordered ? x.t.ol : x.t.ul}>
      {token.items.map((item, i) => (
        <li key={i} className={x.t.li}>
          {blocks(item.tokens, x)}
        </li>
      ))}
    </Tag>
  );
}

function block(token: Token, x: Ctx): ReactNode {
  switch (token.type) {
    case "heading":
      return token.depth <= 2 ? (
        <h2 className={x.t.h2}>{inline(token.tokens, x)}</h2>
      ) : (
        <h3 className={x.t.h3}>{inline(token.tokens, x)}</h3>
      );
    case "paragraph": {
      const image = figureImage(token.tokens ?? []);
      return image ? <Figure image={image} x={x} /> : <p className={x.t.p}>{inline(token.tokens, x)}</p>;
    }
    case "text":
      // A tight list item's content.
      return "tokens" in token && token.tokens ? inline(token.tokens, x) : decodeEntities(token.text);
    case "list":
      return <List token={token as Tokens.List} x={x} />;
    case "table":
      return <Table token={token as Tokens.Table} x={x} />;
    case "blockquote":
      return <Quote token={token as Tokens.Blockquote} x={x} />;
    case "hr":
      return <hr className={x.t.hr} />;
    case "code":
      return (
        <pre className={x.t.pre}>
          <code>{token.text}</code>
        </pre>
      );
    default:
      // space, raw HTML, link definitions: dropped on purpose.
      return null;
  }
}

function blocks(tokens: Token[], x: Ctx): ReactNode {
  return tokens.map((token, i) => <Fragment key={i}>{block(token, x)}</Fragment>);
}

export function PostBody({ markdown, components, theme, figureSizes }: PostBodyProps) {
  const tokens = marked.lexer(markdown);
  // The page prints the title as its <h1>; a body opening with its own `# Title` would show it twice.
  const first = tokens.findIndex((t) => t.type !== "space");
  if (tokens[first]?.type === "heading" && (tokens[first] as Tokens.Heading).depth === 1) tokens.splice(first, 1);
  const x: Ctx = { c: { ...defaults, ...components }, t: theme ?? {}, sizes: figureSizes };
  return <>{blocks(tokens, x)}</>;
}
