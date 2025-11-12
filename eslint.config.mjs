import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: [
      "frontend/admin-dashboard/admin-dashboard-react.js", // Ignore react file
      "node_modules/**",
    ],
  },

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