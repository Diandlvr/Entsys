import { defineConfig } from 'vitest/config';

// Las pruebas corren sobre src/core, que no depende de Electron.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    globals: false,
  },
});
