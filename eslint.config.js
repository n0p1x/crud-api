import globals from "globals";
import tseslint from "typescript-eslint";
import perfectionist from 'eslint-plugin-perfectionist'

export default [
  {files: ["**/*.{js,mjs,cjs,ts}"]},
  {languageOptions: { globals: globals.browser }},
  ...tseslint.configs.recommended,
  perfectionist.configs['recommended-natural'],
];
