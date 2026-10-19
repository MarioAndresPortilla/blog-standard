import { test } from "node:test";
import assert from "node:assert/strict";
import { analyticsConfig, mayLoadOn } from "./analytics";

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
