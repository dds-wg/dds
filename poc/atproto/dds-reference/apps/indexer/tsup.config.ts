import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/db/migrate.ts"],
  format: ["esm"],
  target: "node22",
  platform: "node",
  sourcemap: true,
  clean: true,
  splitting: false,
  dts: false,
  noExternal: ["@dds/client"],
});
