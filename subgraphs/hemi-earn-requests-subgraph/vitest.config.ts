import { defineConfig } from 'vitest/config'

// `createTestIndexer` boots the Envio runtime in a worker thread, so run tests
// in the `forks` pool (avoids worker-in-worker issues) with a generous timeout
// for the first-run startup.
export default defineConfig({
  test: {
    clearMocks: true,
    hookTimeout: 15_000,
    pool: 'forks',
    testTimeout: 15_000,
  },
})
