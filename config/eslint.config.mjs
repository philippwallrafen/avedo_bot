// eslint.config.mjs
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginTypescript from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  {
    ignores: ["node_modules/"],
  },
  {
    files: ["**/*.js", "**/*.cjs", "**/*.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        Sortable: "readonly",
      },
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./config/tsconfig.json",
      },
      globals: {
        ...globals.node,
        ...globals.browser,
        Sortable: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": eslintPluginTypescript,
    },
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": "warn",
    },
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  eslintConfigPrettier,
];
