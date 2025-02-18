import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { L2Token } from 'token-list'
import { getL2Erc20Token } from 'utils/evmApi'
import { isAddress, type Address, type Chain } from 'viem'

type Params = {
  address: string
  chainId: Chain['id']
  enabled?: boolean
  options?: Omit<UseQueryOptions<L2Token, Error>, 'queryKey' | 'queryFn'>
}

/**
 * For most scenarios, prefer useToken hook instead. This token should be used if
 * the info from the RemoteToken (L1) is needed
 */
export const useL2Token = ({ address, chainId, options = {} }: Params) =>
  useQuery({
    ...options,
    enabled: (options.enabled ?? true) && isAddress(address),
    queryFn: () =>
      getL2Erc20Token(address as Address, chainId) satisfies Promise<L2Token>,
    queryKey: ['l2-erc20-token-complete', address, chainId],
  })
