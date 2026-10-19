"use client";
// Site analytics (PostHog): page views, clicks and heatmaps on every client
// site, set up the same way everywhere — and, on a health site, without
// recording anyone.
//
// Privacy rules (the plan's "Health and finance tenants"):
//   - Form inputs are never captured, anywhere.
//   - A sensitive (health) site: no session recording, no element text or
//     attributes, nothing kept in cookies or storage, and booking / contact /
//     intake pages are not tracked at all.
//   - Session recording elsewhere only when a site opts in, inputs masked.
//   - The browser's Do Not Track is honoured.

import { useEffect } from "react";

export interface AnalyticsOptions {
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
export const SENSITIVE_PATHS =
  /(^|\/)(book|booking|bookings|appointment|appointments|schedule|contact|contact-us|intake|consult|consultation|consultations|checkout|account|portal|patient|patients|forms?)(\/|$)/i;

type Event = { properties?: Record<string, unknown> } | null;

const exclusions = (opts: AnalyticsOptions) => [...(opts.excludePaths ?? []), ...(opts.sensitive ? [SENSITIVE_PATHS] : [])];

/** May PostHog load on this page? Only on a page it may track. No path known = yes. */
export function mayLoadOn(opts: AnalyticsOptions, path: string | undefined): boolean {
  if (!opts.apiKey) return false;
  if (path === undefined) return true;
  return !exclusions(opts).some((re) => re.test(path));
}

/** The PostHog settings for a site — pure, so the privacy rules are testable. */
export function analyticsConfig(opts: AnalyticsOptions) {
  const exclude = exclusions(opts);
  const excluded = (url: unknown) => {
    if (typeof url !== "string") return false;
    let path = url;
    try {
      path = new URL(url).pathname;
    } catch {
      /* already a path */
    }
    return exclude.some((re) => re.test(path));
  };
  const replay = !!opts.replay && !opts.sensitive;
  return {
    api_host: opts.host ?? "https://us.i.posthog.com",
    person_profiles: "identified_only" as const,
    capture_pageview: "history_change" as const,
    capture_pageleave: true,
    autocapture: true,
    capture_heatmaps: true,
    respect_dnt: true,
    disable_session_recording: !replay,
    session_recording: { maskAllInputs: true },
    mask_all_text: !!opts.sensitive,
    mask_all_element_attributes: !!opts.sensitive,
    ...(opts.sensitive ? { persistence: "memory" as const } : {}),
    // Anything from an excluded page — a page view, a click, a heatmap point —
    // is dropped before it leaves the browser.
    before_send: (event: Event) => (excluded(event?.properties?.$current_url) ? null : event),
  };
}

/**
 * Drop into the root layout: `<SiteAnalytics apiKey={process.env.NEXT_PUBLIC_POSTHOG_KEY} sensitive />`.
 * Loads PostHog only when there's a key, after the page is interactive.
 */
export function SiteAnalytics(opts: AnalyticsOptions): null {
  const { apiKey, host, sensitive, replay, path } = opts;
  const paths = (opts.excludePaths ?? []).map(String).join("|");
  // Re-runs on navigation when the site passes `path`: PostHog loads the
  // first time the visitor is on a page it may track, then stays loaded.
  const allowed = mayLoadOn(opts, path);
  useEffect(() => {
    if (!apiKey || !allowed) return;
    let cancelled = false;
    import("posthog-js").then(({ default: posthog }) => {
      if (!cancelled && !posthog.__loaded) posthog.init(apiKey, analyticsConfig(opts) as never);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, host, sensitive, replay, paths, allowed]);
  return null;
}
