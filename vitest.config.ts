import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.next', 'tests/**/*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.next/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'coverage/',
        'prisma/',
        '.husky/',
        'docs/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
      ],
      include: ['lib/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
      all: true,
      lines: 10,
      functions: 10,
      branches: 10,
      statements: 10,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
