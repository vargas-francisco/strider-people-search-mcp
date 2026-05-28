import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/evals/**/*.eval.ts'],
    testTimeout: 60_000,
    pool: 'forks',
    forks: { singleFork: true },
  },
});
