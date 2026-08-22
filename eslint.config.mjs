import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/.vercel/**'],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
  },
  {
    files: ['apps/**/*.ts', 'apps/**/*.tsx'],
    languageOptions: {
      globals: {
        document: 'readonly',
        window: 'readonly',
        navigator: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLSelectElement: 'readonly',
      },
    },
  },
)
