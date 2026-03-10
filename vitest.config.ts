import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      // Map @/ to the project root so stores and lib can be imported in tests
      '@': path.resolve(__dirname, '.'),
    },
  },
});
