// ~/config/prettier.config.cjs

/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
  printWidth: 120,
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  embeddedLanguageFormatting: "off",
  endOfLine: "lf",
  overrides: [{ files: ["*.ejs"], options: { parser: "html" } }],
};

module.exports = config;
