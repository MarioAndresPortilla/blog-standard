#!/usr/bin/env node
// blog-standard check [postsDir] [--public <dir>] [--since YYYY-MM-DD] [--legacy a,b,c]
//
// Run in each client site's CI. Exit 1 when a post would render wrong.

import { checkSite, formatReport } from "./check";

function arg(name: string, args: string[]): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd !== "check") {
  console.error("usage: blog-standard check [postsDir] [--public <dir>] [--since YYYY-MM-DD] [--legacy slug,slug]");
  process.exit(2);
}
const positional = rest.filter((a, i) => !a.startsWith("--") && !rest[i - 1]?.startsWith("--"));
const report = checkSite({
  postsDir: positional[0] ?? "content/blog",
  publicDir: arg("public", rest) ?? "public",
  since: arg("since", rest),
  legacy: arg("legacy", rest)?.split(",").filter(Boolean),
});
console.log(formatReport(report));
process.exit(report.ok ? 0 : 1);
