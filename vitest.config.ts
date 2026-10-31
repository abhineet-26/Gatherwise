import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'shared': path.resolve(__dirname, './shared'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    exclude: ['**/node_modules/**', '**/dist/**', 'files/**'],
    environmentMatchGlobs: [
      ['src/**', 'jsdom'],
      ['shared/**', 'node'],
      ['server/**', 'node'],
      ['tests/**', 'node'],
    ],
  },
});
