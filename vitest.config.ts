import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'],
    environment: 'node',
    // Tests must never reach the network. Live adapter clients are only
    // constructed behind the legal gate, and fixtures are the default.
    env: {
      NODE_ENV: 'test',
    },
  },
});
