module.exports = {
  printWidth: 120,
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  embeddedLanguageFormatting: "off",
  plugins: ["prettier-plugin-ejs"],
  overrides: [{ files: ["*.ejs"], options: { parser: "html" } }],
  endOfLine: "lf",
};
