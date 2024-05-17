module.exports = {
  root: true,
  overrides: [
    {
      files: ["*.ts"],
      parserOptions: {
        project: ["tsconfig.json"],
        createDefaultProgram: true,
      },
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        'plugin:prettier/recommended',
        'prettier'
      ],
    },
    {
      files: ["*.spec.ts"],
      plugins: ["jest"],
      rules: {
        // See also https://github.com/jest-community/eslint-plugin-jest/blob/main/docs/rules/unbound-method.md
        "@typescript-eslint/unbound-method": "off",
        "jest/unbound-method": "error",
      },
    },
  ],
};
