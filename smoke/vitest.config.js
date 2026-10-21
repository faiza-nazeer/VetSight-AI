import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', globals: true, setupFiles: ['./smoke/setup.js'], include: ['smoke/*.test.jsx'], testTimeout: 20000, css: { modules: { classNameStrategy: 'non-scoped' } } },
});
