// eslint.config.mjs
import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

export default [
  eslint.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      env: {
        browser: true,
      },
      globals: {
        console: "readonly",
        window: "readonly",
        document: "readonly",
      },
    },
    plugins: { prettier: prettierPlugin },
    rules: {
      "prettier/prettier": "error", // Shows Prettier issues as ESLint errors
      "no-unused-vars": "warn", // Warns for unused variables
      "no-undef": "error", // Flags undeclared variables as errors
    },
  },
];
