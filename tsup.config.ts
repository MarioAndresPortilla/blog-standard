import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts", react: "src/react.tsx", analytics: "src/analytics.tsx", cli: "src/cli.ts" },
  format: ["esm", "cjs"],
  dts: { entry: { index: "src/index.ts", react: "src/react.tsx", analytics: "src/analytics.tsx" } },
  clean: true,
  external: ["react", "posthog-js"],
  target: "node18",
});
