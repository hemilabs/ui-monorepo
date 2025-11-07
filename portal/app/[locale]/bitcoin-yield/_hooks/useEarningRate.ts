import { useQuery } from '@tanstack/react-query'

export const useEarningRate = () =>
  useQuery({
    // TODO implement earning rate calc
    // See https://github.com/hemilabs/ui-monorepo/issues/1619
    queryFn: () => Promise.resolve('6.3'),
    queryKey: ['bitcoin-yield', 'earning-rate'],
  })
