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
}
/** Pages a health site never tracks: anywhere a visitor might type about themselves. */
declare const SENSITIVE_PATHS: RegExp;
type Event = {
    properties?: Record<string, unknown>;
} | null;
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

export { type AnalyticsOptions, SENSITIVE_PATHS, SiteAnalytics, analyticsConfig };
