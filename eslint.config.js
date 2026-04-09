import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';

export default [
  {
    ignores: ['.next/**', 'out/**', 'dist/**', 'node_modules/**'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      'react/no-unescaped-entities': 'off',
    },
  },
];
