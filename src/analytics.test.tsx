import { test } from "node:test";
import assert from "node:assert/strict";
import { analyticsConfig, mayLoadOn, withoutQuery } from "./analytics";

const ev = (url: string) => ({ properties: { $current_url: url } });

test("a health site records no one: no replay, no text, nothing stored", () => {
  const c = analyticsConfig({ apiKey: "k", sensitive: true, replay: true });
  assert.equal(c.disable_session_recording, true, "replay stays off even when asked for");
  assert.equal(c.mask_all_text, true);
  assert.equal(c.mask_all_element_attributes, true);
  assert.equal(c.persistence, "memory", "no cookies or storage");
  assert.equal(c.session_recording.maskAllInputs, true);
  assert.equal(c.respect_dnt, true);
});

test("a health site's booking, contact and intake pages aren't tracked at all", () => {
  const c = analyticsConfig({ apiKey: "k", sensitive: true });
  for (const url of ["https://site.com/book", "https://site.com/es/booking/", "https://site.com/contact", "https://site.com/es/contact", "https://site.com/intake/step-2", "/consultation"]) {
    assert.equal(c.before_send(ev(url)), null, url);
  }
  assert.notEqual(c.before_send(ev("https://site.com/blog/retinol-guide")), null, "the blog is tracked");
  assert.notEqual(c.before_send(ev("https://site.com/bookkeeping-tips")), null, "a word that merely starts with 'book' isn't excluded");
});

test("an ordinary site: heatmaps and pages, replay only when it opts in, inputs always masked", () => {
  const off = analyticsConfig({ apiKey: "k" });
  assert.equal(off.capture_heatmaps, true);
  assert.equal(off.disable_session_recording, true);
  assert.equal(off.mask_all_text, false);
  assert.equal("persistence" in off, false);
  const on = analyticsConfig({ apiKey: "k", replay: true });
  assert.equal(on.disable_session_recording, false);
  assert.equal(on.session_recording.maskAllInputs, true);
});

test("a site can exclude its own pages too", () => {
  const c = analyticsConfig({ apiKey: "k", excludePaths: [/^\/admin/] });
  assert.equal(c.before_send(ev("https://site.com/admin/users")), null);
  assert.notEqual(c.before_send(ev("https://site.com/")), null);
});

test("given the page's path, PostHog isn't even loaded on a page it may not track", () => {
  const health = { apiKey: "k", sensitive: true };
  assert.equal(mayLoadOn(health, "/contact"), false, "a health site's contact page never contacts PostHog");
  assert.equal(mayLoadOn(health, "/es/booking"), false);
  assert.equal(mayLoadOn(health, "/blog/retinol-guide"), true);
  assert.equal(mayLoadOn({ apiKey: "k", excludePaths: [/^\/deposit/] }, "/deposit/success"), false);
  assert.equal(mayLoadOn(health, undefined), true, "no path known: load, and drop excluded pages' events instead");
  assert.equal(mayLoadOn({ sensitive: true }, "/blog"), false, "no key: never");
});

test("heatmap points from an excluded page never leave, even batched onto a later page", () => {
  const c = analyticsConfig({ apiKey: "k", excludePaths: [/^\/preferences/, /^\/login/] });
  const out = c.before_send({
    properties: {
      $current_url: "https://site.com/",
      $heatmap_data: {
        "https://site.com/preferences?token=eyJlbWFpbCI6ImFAYi5jb20ifQ": [{ x: 1 }],
        "https://site.com/login": [{ x: 2 }],
        "https://site.com/blog/post?ref=x": [{ x: 3 }],
      },
    },
  }) as { properties: { $heatmap_data: Record<string, unknown> } };
  assert.deepEqual(Object.keys(out.properties.$heatmap_data), ["https://site.com/blog/post"]);
});

test("an excluded page never rides along as an entry page or referrer; query strings are stripped everywhere", () => {
  const c = analyticsConfig({ apiKey: "k", excludePaths: [/^\/preferences/] });
  const out = c.before_send({
    properties: {
      $current_url: "https://site.com/pricing?coupon=SECRET&utm_source=news",
      $session_entry_url: "https://site.com/preferences?token=abc",
      $referrer: "https://site.com/preferences?token=abc",
      $initial_referrer: "https://google.com/search?q=private",
      $referring_domain: "google.com",
      $set_once: { $initial_current_url: "https://site.com/preferences?token=abc" },
    },
  }) as { properties: Record<string, any> };
  assert.equal(out.properties.$current_url, "https://site.com/pricing?utm_source=news", "only campaign tags survive");
  assert.equal(out.properties.$session_entry_url, "(excluded page)");
  assert.equal(out.properties.$referrer, "(excluded page)");
  assert.equal(out.properties.$initial_referrer, "https://google.com/search");
  assert.equal(out.properties.$referring_domain, "google.com", "a domain isn't a URL");
  assert.equal(out.properties.$set_once.$initial_current_url, "(excluded page)");
});

test("the person's first page never leaves: posthog-js sends $set / $set_once beside properties, not inside", () => {
  const c = analyticsConfig({ apiKey: "k", excludePaths: [/^\/preferences/] });
  const out = c.before_send({
    properties: { $current_url: "https://site.com/", $initial_pathname: "/preferences", $prev_pageview_pathname: "/preferences" },
    $set: { $current_url: "https://site.com/pricing?coupon=SECRET" },
    $set_once: {
      $initial_current_url: "https://site.com/preferences?token=eyJlbWFpbCI6ImFAYi5jb20ifQ",
      $initial_pathname: "/preferences",
      $initial_referrer: "https://mail.example.com/inbox?msg=123",
      $initial_referring_domain: "mail.example.com",
      $current_url: "https://site.com/blog/post?ref=abc#access_token=xyz",
    },
  }) as Record<string, any>;
  assert.equal(out.$set_once.$initial_current_url, "(excluded page)");
  assert.equal(out.$set_once.$initial_pathname, "(excluded page)");
  assert.equal(out.$set_once.$initial_referrer, "https://mail.example.com/inbox");
  assert.equal(out.$set_once.$initial_referring_domain, "mail.example.com");
  assert.equal(out.$set_once.$current_url, "https://site.com/blog/post");
  assert.equal(out.$set.$current_url, "https://site.com/pricing");
  assert.equal(out.properties.$initial_pathname, "(excluded page)");
  assert.equal(out.properties.$prev_pageview_pathname, "(excluded page)");
  assert.equal("$set" in c.before_send(ev("https://site.com/"))!, false, "no person properties added where there were none");
  assert.equal(c.disable_capture_url_hashes, true, "PostHog drops #fragments where before_send can't reach");
});

test("withoutQuery keeps campaign tags only, and drops the #fragment", () => {
  assert.equal(withoutQuery("https://a.com/p?utm_campaign=x&token=y"), "https://a.com/p?utm_campaign=x");
  assert.equal(withoutQuery("https://a.com/p?email=a@b.com"), "https://a.com/p");
  assert.equal(withoutQuery("/p?x=1"), "/p");
  assert.equal(withoutQuery("https://a.com/auth/callback#access_token=abc&refresh_token=def"), "https://a.com/auth/callback");
  assert.equal(withoutQuery("https://a.com/p?utm_source=x#token=y"), "https://a.com/p?utm_source=x");
  assert.equal(withoutQuery("/p#token=y"), "/p");
});
