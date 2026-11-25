#!/usr/bin/env node
import {
  checkSite,
  formatReport
} from "./chunk-ALXOOS3L.js";

// src/cli.ts
var USAGE = "usage: blog-standard check [postsDir] [--public <dir>] [--since YYYY-MM-DD] [--legacy slug,slug] [--marked]";
var VALUED = /* @__PURE__ */ new Set(["--public", "--since", "--legacy"]);
function arg(name, args) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : void 0;
}
var [cmd, ...rest] = process.argv.slice(2);
if (cmd !== "check") {
  console.error(USAGE);
  process.exit(2);
}
var positional = rest.filter((a, i) => !a.startsWith("--") && !VALUED.has(rest[i - 1] ?? ""));
var report = checkSite({
  postsDir: positional[0] ?? "content/blog",
  publicDir: arg("public", rest) ?? "public",
  since: arg("since", rest),
  legacy: arg("legacy", rest)?.split(",").filter(Boolean),
  marked: rest.includes("--marked")
});
console.log(formatReport(report));
process.exit(report.ok ? 0 : 1);
