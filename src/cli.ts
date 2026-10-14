#!/usr/bin/env node
// blog-standard check [postsDir] [--public <dir>] [--since YYYY-MM-DD] [--legacy a,b,c] [--marked]
//
// Run in each client site's CI. Exit 1 when a post would render wrong.

import { checkSite, formatReport } from "./check";

const USAGE = "usage: blog-standard check [postsDir] [--public <dir>] [--since YYYY-MM-DD] [--legacy slug,slug] [--marked]";

// Flags that take a value; anything else starting with -- is a switch.
const VALUED = new Set(["--public", "--since", "--legacy"]);

function arg(name: string, args: string[]): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd !== "check") {
  console.error(USAGE);
  process.exit(2);
}
const positional = rest.filter((a, i) => !a.startsWith("--") && !VALUED.has(rest[i - 1] ?? ""));
const report = checkSite({
  postsDir: positional[0] ?? "content/blog",
  publicDir: arg("public", rest) ?? "public",
  since: arg("since", rest),
  legacy: arg("legacy", rest)?.split(",").filter(Boolean),
  marked: rest.includes("--marked"),
});
console.log(formatReport(report));
process.exit(report.ok ? 0 : 1);
