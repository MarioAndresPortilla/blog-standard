"use strict";
"use client";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/analytics.tsx
var analytics_exports = {};
__export(analytics_exports, {
  SENSITIVE_PATHS: () => SENSITIVE_PATHS,
  SiteAnalytics: () => SiteAnalytics,
  analyticsConfig: () => analyticsConfig,
  mayLoadOn: () => mayLoadOn
});
module.exports = __toCommonJS(analytics_exports);
var import_react = require("react");
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
  (0, import_react.useEffect)(() => {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SENSITIVE_PATHS,
  SiteAnalytics,
  analyticsConfig,
  mayLoadOn
});
