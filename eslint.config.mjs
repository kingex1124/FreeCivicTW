import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import ts from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import next from '@next/eslint-plugin-next';
import globals from 'globals';
const boundaries = (patterns) => ['error', { patterns }];
export default defineConfig([
  js.configs.recommended,
  ...ts.configs.recommended,
  globalIgnores([
    '.next/**',
    'out/**',
    'node_modules/**',
    'public/**',
    'test-results/**',
    '.qa/**',
    'playwright-report/**',
  ]),
  { languageOptions: { globals: { ...globals.node, ...globals.browser } } },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': hooks, '@next/next': next },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,
    },
  },
  {
    files: ['src/View/**/*.{ts,tsx}', 'src/app/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': boundaries(['@/Repository/*', '@data/*', '**/Data/*']) },
  },
  {
    files: ['src/Service/**/*.ts'],
    rules: {
      'no-restricted-imports': boundaries(['@data/*', '**/Data/*', '@/View/*', '@/app/*']),
      'no-restricted-globals': ['error', 'fetch', 'localStorage', 'sessionStorage'],
    },
  },
  {
    files: ['src/Model/**/*.ts'],
    rules: {
      'no-restricted-imports': boundaries(['@/Repository/*', '@/Service/*', '@/View/*', '@data/*']),
    },
  },
  {
    files: ['src/Repository/**/*.ts'],
    rules: { 'no-restricted-imports': boundaries(['@/Service/*', '@/View/*', '@/app/*']) },
  },
]);
