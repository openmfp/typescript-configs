import index from "./index.js";
import angularPlugin from "angular-eslint";
import pluginTs from "typescript-eslint";

export default pluginTs.config(
  ...index,
  {
    // angular rules for typescript files
    files: ["**/*.ts"],
    extends: [...angularPlugin.configs.tsRecommended],
    processor: angularPlugin.processInlineTemplates,
    rules: {
      "@angular-eslint/consistent-component-styles": "error",
      "@angular-eslint/no-duplicates-in-metadata-arrays": "error",
      "@angular-eslint/no-uncalled-signals": "error",
      "@angular-eslint/prefer-on-push-component-change-detection": "error",
      "@angular-eslint/prefer-output-readonly": "error",
      "@angular-eslint/relative-url-prefix": "error",
      "@angular-eslint/runtime-localize": "error",
      "@angular-eslint/sort-keys-in-type-decorator": "error",
      "@angular-eslint/sort-lifecycle-methods": "error",
      "@angular-eslint/use-component-selector": "error",
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angularPlugin.configs.templateRecommended,
      ...angularPlugin.configs.templateAccessibility,
    ],
    rules: {
      // because fundamental button uses input for the text instead of content
      "@angular-eslint/template/elements-content": "off",
      "@angular-eslint/template/prefer-control-flow": "error",
      "@angular-eslint/template/no-duplicate-attributes": "error",
      "@angular-eslint/template/no-interpolation-in-attributes": "error",
      "@angular-eslint/template/no-nested-tags": "error",
      "@angular-eslint/template/prefer-at-empty": "error",
      "@angular-eslint/template/prefer-contextual-for-variables": "error",
      "@angular-eslint/template/prefer-self-closing-tags": "error",
      "@angular-eslint/template/prefer-static-string-properties": "error",
      "@angular-eslint/template/attributes-order": [
        "error",
        {
          alphabetical: true,
        },
      ],
    },
  },
);
