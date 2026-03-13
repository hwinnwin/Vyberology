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
        'src/**/*.{ts,tsx}',
      ],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'src/main.tsx',
        'src/components/ui/**',
        'android/**',
        'ios/**',
        'dist/**',
        'src/lib/numerology/types.ts',
        'src/pages/**',
        'src/integrations/**',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        lines: 0.80,
        functions: 0.80,
        branches: 0.70,
        statements: 0.80,
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
