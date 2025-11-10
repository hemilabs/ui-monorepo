import { useQuery } from '@tanstack/react-query'

export const useHolders = () =>
  useQuery({
    // TODO implement subgraph to get holders
    // See https://github.com/hemilabs/ui-monorepo/issues/1619
    queryFn: () => Promise.resolve(42),
    queryKey: ['bitcoin-yield', 'holders'],
  })
