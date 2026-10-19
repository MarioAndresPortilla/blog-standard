interface AnalyticsOptions {
    /** The site's PostHog project key (public). Without one, analytics is off. */
    apiKey?: string;
    /** PostHog host. Default: PostHog Cloud US. */
    host?: string;
    /** A health (or otherwise sensitive) site: see the rules above. */
    sensitive?: boolean;
    /** Record sessions, inputs masked. Never on a sensitive site. */
    replay?: boolean;
    /** Pages never tracked, by path (a sensitive site always adds booking/contact/intake pages). */
    excludePaths?: RegExp[];
    /**
     * The current page's path (e.g. Next's `usePathname()`). When given,
     * PostHog isn't even loaded until the visitor reaches a page that may be
     * tracked — on an excluded page it isn't contacted at all. Without it,
     * PostHog loads at once and events from excluded pages are dropped.
     */
    path?: string;
}
/** Pages a health site never tracks: anywhere a visitor might type about themselves. */
declare const SENSITIVE_PATHS: RegExp;
type Event = {
    properties?: Record<string, unknown>;
} | null;
/** May PostHog load on this page? Only on a page it may track. No path known = yes. */
declare function mayLoadOn(opts: AnalyticsOptions, path: string | undefined): boolean;
/** The PostHog settings for a site — pure, so the privacy rules are testable. */
declare function analyticsConfig(opts: AnalyticsOptions): {
    before_send: (event: Event) => Event;
    persistence?: "memory" | undefined;
    api_host: string;
    person_profiles: "identified_only";
    capture_pageview: "history_change";
    capture_pageleave: boolean;
    autocapture: boolean;
    capture_heatmaps: boolean;
    respect_dnt: boolean;
    disable_session_recording: boolean;
    session_recording: {
        maskAllInputs: boolean;
    };
    mask_all_text: boolean;
    mask_all_element_attributes: boolean;
};
/**
 * Drop into the root layout: `<SiteAnalytics apiKey={process.env.NEXT_PUBLIC_POSTHOG_KEY} sensitive />`.
 * Loads PostHog only when there's a key, after the page is interactive.
 */
declare function SiteAnalytics(opts: AnalyticsOptions): null;

export { type AnalyticsOptions, SENSITIVE_PATHS, SiteAnalytics, analyticsConfig, mayLoadOn };
