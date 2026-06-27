import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Use esbuild JSX (built-in, no Vite 8/rolldown dependency)
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/lib/**', 'src/stores/**', 'src/hooks/**', 'src/components/**'],
    },
  },
})
