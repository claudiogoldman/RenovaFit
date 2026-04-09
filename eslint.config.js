import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import typescript from 'typescript-eslint';

export default [
  {
    ignores: ['.next/**', 'out/**', 'dist/**', 'node_modules/**'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescript.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: 'readonly',
        fetch: 'readonly',
        navigator: 'readonly',
        process: 'readonly',
        React: 'readonly',
      },
    },
    plugins: {
      '@next/next': nextPlugin,
      '@typescript-eslint': typescript.plugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...typescript.configs.recommended[0].rules,
      ...nextPlugin.configs.recommended.rules,
      'react/no-unescaped-entities': 'off',
    },
  },
];
