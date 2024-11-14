import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { L2Token } from 'types/token'
import { getL2Erc20Token } from 'utils/evmApi'
import { isAddress, type Address, type Chain } from 'viem'

type Params = {
  address: string
  chainId: Chain['id']
  enabled?: boolean
  options?: Omit<UseQueryOptions<L2Token, Error>, 'queryKey' | 'queryFn'>
}

export const useL2Token = ({ address, chainId, options = {} }: Params) =>
  useQuery({
    ...options,
    enabled: (options.enabled ?? true) && isAddress(address),
    queryFn: () =>
      getL2Erc20Token(address as Address, chainId) satisfies Promise<L2Token>,
    queryKey: ['l2-erc20-token-complete', address, chainId],
    retry: 1,
  })
