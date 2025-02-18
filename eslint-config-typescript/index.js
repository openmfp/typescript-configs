// @ts-check
import pluginTs from "typescript-eslint";
import pluginJs from "@eslint/js";
import pluginJest from "eslint-plugin-jest";
import pluginPrettier from "eslint-config-prettier";

export default pluginTs.config(
    // config to all javascript and typescript files
    {
        files: ["**/*.ts", "**/*.js"],
        extends: [pluginJs.configs.recommended, pluginPrettier],
        rules: {
            "no-duplicate-imports": "error",
        }
    },
    {
        // config to all typescript files only
        files: ["**/*.ts"],
        extends: [pluginTs.configs.recommended, pluginTs.configs.stylistic],
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                },
            ],
        }
    },
    {
      // config to test files only
      files: ['**/*.spec.ts'],
      ...pluginJest.configs['flat/recommended'],
      rules: {
        ...pluginJest.configs['flat/recommended'].rules,
      }
    },
);
