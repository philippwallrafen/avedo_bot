// eslint.config.mjs
import eslintPluginTypescript from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";
import prettier from "eslint-plugin-prettier";

export default [
  {
    files: ["**/*.js", "**/*.cjs", "**/*.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        Sortable: "readonly",
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      "prettier/prettier": "error",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./config/tsconfig.json", // Pfad zur richtigen tsconfig
      },
      globals: {
        ...globals.node,
        ...globals.browser,
        Sortable: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": eslintPluginTypescript,
      prettier,
    },
    rules: {
      //"@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": "warn",
      "prettier/prettier": "error",
    },
  },
];
