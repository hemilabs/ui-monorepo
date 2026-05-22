import { QueryClient } from '@tanstack/react-query'

// QueryClient configured so fetcher tests can seed
// the cache via `setQueryData` and read it back through `ensureQueryData`
// without retries getting in the way.
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
