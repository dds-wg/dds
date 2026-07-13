import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/auth/browser.ts",
    "src/auth/node.ts",
    "src/feed.ts",
    "src/replay.ts",
    "src/indexer.ts",
    "src/lexicon/index.ts"
  ],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2022",
  splitting: false,
  treeshake: true
});
