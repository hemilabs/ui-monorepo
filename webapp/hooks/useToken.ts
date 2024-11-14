import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { Token } from 'types/token'
import { getErc20Token } from 'utils/evmApi'
import { getNativeToken, getTokenByAddress, isNativeAddress } from 'utils/token'
import { type Address, type Chain, isAddress } from 'viem'

type Params = {
  address: string
  chainId: Chain['id']
  options?: Omit<UseQueryOptions<Token, Error>, 'queryKey' | 'queryFn'>
}

export const useToken = ({ address, chainId, options = {} }: Params) =>
  useQuery<Token, Error>({
    ...options,
    enabled: (options.enabled ?? true) && isAddress(address),
    queryFn: async () =>
      isNativeAddress(address)
        ? getNativeToken(chainId)
        : getTokenByAddress(address, chainId) ??
          (getErc20Token(address as Address, chainId) satisfies Promise<Token>),
    queryKey: ['erc20-token-complete', address, chainId],
  })
