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
  mayLoadOn: () => mayLoadOn,
  withoutQuery: () => withoutQuery
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
function pathOf(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return url.split(/[?#]/)[0];
  }
}
function withoutQuery(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return url.split("?")[0];
  }
  const keep = new URLSearchParams();
  for (const [k, v] of u.searchParams) if (/^utm_/i.test(k)) keep.append(k, v);
  u.search = keep.toString();
  return u.toString();
}
function analyticsConfig(opts) {
  const exclude = exclusions(opts);
  const excluded = (url) => typeof url === "string" && exclude.some((re) => re.test(pathOf(url)));
  const isUrlKey = (k) => /url|referrer/i.test(k) && !/domain/i.test(k);
  const clean = (props) => {
    if (!props || typeof props !== "object") return props;
    const out = {};
    for (const [k, v] of Object.entries(props)) {
      if (typeof v === "string" && isUrlKey(k) && /^(https?:\/\/|\/)/.test(v)) {
        out[k] = excluded(v) ? "(excluded page)" : withoutQuery(v);
      } else if ((k === "$set" || k === "$set_once") && v && typeof v === "object") {
        out[k] = clean(v);
      } else {
        out[k] = v;
      }
    }
    const heat = out.$heatmap_data;
    if (heat && typeof heat === "object") {
      const kept = {};
      for (const [url, points] of Object.entries(heat)) if (!excluded(url)) kept[withoutQuery(url)] = points;
      out.$heatmap_data = kept;
    }
    return out;
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
    // An event from an excluded page is dropped before it leaves the browser;
    // every other event is cleaned of excluded addresses and query strings.
    before_send: (event) => {
      if (!event || excluded(event.properties?.$current_url)) return null;
      return { ...event, properties: clean(event.properties) };
    }
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
  mayLoadOn,
  withoutQuery
});
