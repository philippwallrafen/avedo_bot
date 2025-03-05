// eslint.config.mjs
import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import globals from "globals";  // ✅ Automatische Browser-Globals

export default [
  eslint.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser, // ✅ Alle Browser-Globals automatisch setzen!
        Sortable: "readonly", // ✅ Externe Library als Global setzen
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "error",
      "no-unused-vars": "warn",
      "no-undef": "error",
    },
  },
];
