import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.js"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },

    extends: [js.configs.recommended],

    rules: {
      "no-unused-vars": "warn",
      "no-undef": "off",
    },
  },
]);