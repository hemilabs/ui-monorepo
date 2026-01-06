import { useQuery } from '@tanstack/react-query'

export const useEarningRate = () =>
  useQuery({
    // See https://github.com/hemilabs/ui-monorepo/issues/1687
    queryFn: () => Promise.resolve(7),
    queryKey: ['bitcoin-yield', 'earning-rate'],
  })
