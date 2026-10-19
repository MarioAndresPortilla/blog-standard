"use client";
// Site analytics (PostHog): page views, clicks and heatmaps on every client
// site, set up the same way everywhere — and, on a health site, without
// recording anyone.
//
// Privacy rules (the plan's "Health and finance tenants"):
//   - Form inputs are never captured, anywhere; addresses lose their query
//     strings (campaign tags kept) and #fragments, and an excluded page's
//     address never travels on a later event (referrer, entry page, the
//     person's first page, batched heatmap points).
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

// posthog-js puts person properties beside `properties`, not inside them:
// `$set_once` carries the person's first page and the session's entry page.
type Event = { properties?: Props; $set?: Props; $set_once?: Props } | null;

const exclusions = (opts: AnalyticsOptions) => [...(opts.excludePaths ?? []), ...(opts.sensitive ? [SENSITIVE_PATHS] : [])];

/** May PostHog load on this page? Only on a page it may track. No path known = yes. */
export function mayLoadOn(opts: AnalyticsOptions, path: string | undefined): boolean {
  if (!opts.apiKey) return false;
  if (path === undefined) return true;
  return !exclusions(opts).some((re) => re.test(path));
}

type Props = Record<string, unknown>;

/** A URL's path, whether it's a full URL or already a path. */
function pathOf(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url.split(/[?#]/)[0];
  }
}

/**
 * A URL with its query string removed — except campaign tags (utm_*), which
 * are the only parameters analytics needs. Tokens, emails, session ids and
 * amounts travel in query strings (`/preferences?token=…`,
 * `/invoice?email=…`, `/payment/success?session_id=…`), and sign-in links
 * put tokens in the #fragment (`/auth/callback#access_token=…`), so that goes too.
 */
export function withoutQuery(url: string): string {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return url.split(/[?#]/)[0];
  }
  const keep = new URLSearchParams();
  for (const [k, v] of u.searchParams) if (/^utm_/i.test(k)) keep.append(k, v);
  u.search = keep.toString();
  u.hash = "";
  return u.toString();
}

/** The PostHog settings for a site — pure, so the privacy rules are testable. */
export function analyticsConfig(opts: AnalyticsOptions) {
  const exclude = exclusions(opts);
  const excluded = (url: unknown) => typeof url === "string" && exclude.some((re) => re.test(pathOf(url)));

  // Every URL-like property PostHog attaches — the page, the referrer, where
  // the session started, the person's first page — is cleaned: an excluded
  // page's address is blanked, every other address loses its query string.
  const isUrlKey = (k: string) => /url|referrer|pathname/i.test(k) && !/domain/i.test(k);
  const clean = (props: Props | undefined): Props | undefined => {
    if (!props || typeof props !== "object") return props;
    const out: Props = {};
    for (const [k, v] of Object.entries(props)) {
      if (typeof v === "string" && isUrlKey(k) && /^(https?:\/\/|\/)/.test(v)) {
        out[k] = excluded(v) ? "(excluded page)" : withoutQuery(v);
      } else if ((k === "$set" || k === "$set_once") && v && typeof v === "object") {
        out[k] = clean(v as Props);
      } else {
        out[k] = v;
      }
    }
    // Heatmap points are batched by the page they happened on and can leave
    // from a later page: drop an excluded page's points, unquery the rest.
    const heat = out.$heatmap_data;
    if (heat && typeof heat === "object") {
      const kept: Props = {};
      for (const [url, points] of Object.entries(heat as Props)) if (!excluded(url)) kept[withoutQuery(url)] = points;
      out.$heatmap_data = kept;
    }
    return out;
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
    // Also strips #fragments where before_send can't reach (link hrefs in clicks, replay).
    disable_capture_url_hashes: true,
    disable_session_recording: !replay,
    session_recording: { maskAllInputs: true },
    mask_all_text: !!opts.sensitive,
    mask_all_element_attributes: !!opts.sensitive,
    ...(opts.sensitive ? { persistence: "memory" as const } : {}),
    // An event from an excluded page is dropped before it leaves the browser;
    // every other event is cleaned of excluded addresses and query strings.
    before_send: (event: Event) => {
      if (!event || excluded(event.properties?.$current_url)) return null;
      const out = { ...event, properties: clean(event.properties) };
      if (event.$set) out.$set = clean(event.$set);
      if (event.$set_once) out.$set_once = clean(event.$set_once);
      return out;
    },
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
