import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'json-summary'],
      include: [
        'src/components/CompatibilityForm.tsx',
        'src/components/PairReadingCard.tsx',
        'src/components/ReadingCard.tsx',
        'src/components/ReadingForm.tsx',
        'src/lib/numerology/**/*.ts',
      ],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'src/main.tsx',
        'src/components/ui/**', // Exclude shadcn UI components
        'android/**',
        'ios/**',
        'dist/**',
        'src/lib/numerology/types.ts',
      ],
      thresholds: {
        lines: 0.95,
        functions: 0.95,
        branches: 0.9,
        statements: 0.95,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@vybe/analytics-adapter': path.resolve(__dirname, './src/test/mocks/analytics-adapter.ts'),
    },
  },
});
