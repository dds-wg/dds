import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import sveltePlugin from "eslint-plugin-svelte";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [".astro/", ".netlify/", "dist/", "node_modules/"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  ...sveltePlugin.configs["flat/recommended"],
  {
    files: ["src/**/*.ts", "src/**/*.svelte"],
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  eslintConfigPrettier,
  ...sveltePlugin.configs["flat/prettier"],
);
