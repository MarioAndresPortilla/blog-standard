#!/usr/bin/env node
import {
  checkSite,
  formatReport
} from "./chunk-RJI3577F.js";

// src/cli.ts
function arg(name, args) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : void 0;
}
var [cmd, ...rest] = process.argv.slice(2);
if (cmd !== "check") {
  console.error("usage: blog-standard check [postsDir] [--public <dir>] [--since YYYY-MM-DD] [--legacy slug,slug]");
  process.exit(2);
}
var positional = rest.filter((a, i) => !a.startsWith("--") && !rest[i - 1]?.startsWith("--"));
var report = checkSite({
  postsDir: positional[0] ?? "content/blog",
  publicDir: arg("public", rest) ?? "public",
  since: arg("since", rest),
  legacy: arg("legacy", rest)?.split(",").filter(Boolean)
});
console.log(formatReport(report));
process.exit(report.ok ? 0 : 1);
