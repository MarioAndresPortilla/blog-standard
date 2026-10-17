import * as react from 'react';
import { ReactNode } from 'react';

/** The standard generates every figure at 1536×1024, so that's the box reserved before it loads. */
declare const FIGURE_WIDTH = 1536;
declare const FIGURE_HEIGHT = 1024;
interface ImageProps {
    src: string;
    alt: string;
    width: number;
    height: number;
    sizes?: string;
    className?: string;
}
interface LinkProps {
    href: string;
    className?: string;
    children: ReactNode;
}
interface VideoProps {
    src: string;
    label: string;
    width: number;
    height: number;
    className?: string;
}
interface PostBodyComponents {
    Image?: (props: ImageProps) => ReactNode;
    Link?: (props: LinkProps) => ReactNode;
    Video?: (props: VideoProps) => ReactNode;
    Reveal?: (props: {
        children: ReactNode;
    }) => ReactNode;
}
/** A class name per element. Every key is optional. */
interface PostBodyTheme {
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
interface PostBodyProps {
    markdown: string;
    components?: PostBodyComponents;
    theme?: PostBodyTheme;
    /** `sizes` for figure images, e.g. "(max-width: 768px) 100vw, 620px". */
    figureSizes?: string;
}
declare function decodeEntities(text: string): string;
declare function PostBody({ markdown, components, theme, figureSizes }: PostBodyProps): react.JSX.Element;

export { FIGURE_HEIGHT, FIGURE_WIDTH, type ImageProps, type LinkProps, PostBody, type PostBodyComponents, type PostBodyProps, type PostBodyTheme, type VideoProps, decodeEntities };
