// See also https://prettier.io/docs/en/options.html

const config = {
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  singleQuote: true,
  semi: true,
  trailingComma: "all",
  plugins: ["@trivago/prettier-plugin-sort-imports"],
  // for @trivago/prettier-plugin-sort-imports
  importOrderParserPlugins: ["typescript", "decorators"],
  "importOrderSortSpecifiers": true
};

export default config;
