"use client";

// src/analytics.tsx
import { useEffect } from "react";
var SENSITIVE_PATHS = /(^|\/)(book|booking|bookings|appointment|appointments|schedule|contact|contact-us|intake|consult|consultation|consultations|checkout|account|portal|patient|patients|forms?)(\/|$)/i;
var exclusions = (opts) => [...opts.excludePaths ?? [], ...opts.sensitive ? [SENSITIVE_PATHS] : []];
function mayLoadOn(opts, path) {
  if (!opts.apiKey) return false;
  if (path === void 0) return true;
  return !exclusions(opts).some((re) => re.test(path));
}
function analyticsConfig(opts) {
  const exclude = exclusions(opts);
  const excluded = (url) => {
    if (typeof url !== "string") return false;
    let path = url;
    try {
      path = new URL(url).pathname;
    } catch {
    }
    return exclude.some((re) => re.test(path));
  };
  const replay = !!opts.replay && !opts.sensitive;
  return {
    api_host: opts.host ?? "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: "history_change",
    capture_pageleave: true,
    autocapture: true,
    capture_heatmaps: true,
    respect_dnt: true,
    disable_session_recording: !replay,
    session_recording: { maskAllInputs: true },
    mask_all_text: !!opts.sensitive,
    mask_all_element_attributes: !!opts.sensitive,
    ...opts.sensitive ? { persistence: "memory" } : {},
    // Anything from an excluded page — a page view, a click, a heatmap point —
    // is dropped before it leaves the browser.
    before_send: (event) => excluded(event?.properties?.$current_url) ? null : event
  };
}
function SiteAnalytics(opts) {
  const { apiKey, host, sensitive, replay, path } = opts;
  const paths = (opts.excludePaths ?? []).map(String).join("|");
  const allowed = mayLoadOn(opts, path);
  useEffect(() => {
    if (!apiKey || !allowed) return;
    let cancelled = false;
    import("posthog-js").then(({ default: posthog }) => {
      if (!cancelled && !posthog.__loaded) posthog.init(apiKey, analyticsConfig(opts));
    });
    return () => {
      cancelled = true;
    };
  }, [apiKey, host, sensitive, replay, paths, allowed]);
  return null;
}
export {
  SENSITIVE_PATHS,
  SiteAnalytics,
  analyticsConfig,
  mayLoadOn
};
