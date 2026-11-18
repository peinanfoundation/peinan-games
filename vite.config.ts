import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // GitHub Pages project site: https://peinanfoundation.github.io/peinan-games/
  base: '/peinan-games/',
  plugins: [react()],
  test: {
    environment: 'node',
  },
});
