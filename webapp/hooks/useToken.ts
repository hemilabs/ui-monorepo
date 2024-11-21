import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { RemoteChain } from 'types/chain'
import { Token } from 'types/token'
import { getErc20Token } from 'utils/evmApi'
import { getTokenByAddress, isNativeAddress } from 'utils/token'
import { type Address, type Chain, isAddress } from 'viem'

type Params = {
  address: string
  chainId: RemoteChain['id']
  options?: Omit<UseQueryOptions<Token, Error>, 'queryKey' | 'queryFn'>
}

export const getUseTokenQueryKey = (
  address: Params['address'],
  chainId: Params['chainId'],
) => ['erc20-token-complete', address, chainId]

export const useToken = ({ address, chainId, options = {} }: Params) =>
  useQuery<Token, Error>({
    ...options,
    enabled:
      (options.enabled ?? true) &&
      (isAddress(address, { strict: false }) || isNativeAddress(address)),
    queryFn: async () =>
      getTokenByAddress(address, chainId) ??
      // up to this point, chainId must be an EVM one because we checked for native addresses
      (getErc20Token(
        address as Address,
        chainId as Chain['id'],
      ) satisfies Promise<Token>),
    queryKey: getUseTokenQueryKey(address, chainId),
  })
