// eslint.config.mjs
import globals from "globals";
import pluginJS from "@eslint/js";
import tseslint from "typescript-eslint";
import tsParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ["node_modules/"],
  },
  {
    files: ["**/*.{js,cjs,mjs}"],
    languageOptions: {},
  },
  {
    files: ["**/*.{ts,cts,mts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./config/tsconfig.json",
      },
    },
  },
  { languageOptions: { globals: { ...globals.node, ...globals.browser, Sortable: "readonly" } } },
  pluginJS.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
];
