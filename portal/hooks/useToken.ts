import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { RemoteChain } from 'types/chain'
import { Token } from 'types/token'
import { toChecksumAddress } from 'utils/address'
import { isNativeAddress } from 'utils/nativeToken'
import { getErc20Token, getTokenByAddress } from 'utils/token'
import { type Address, type Chain, isAddress } from 'viem'
import { useConfig } from 'wagmi'

type Params = {
  address: string | undefined
  chainId: RemoteChain['id']
  options?: Omit<UseQueryOptions<Token, Error>, 'queryKey' | 'queryFn'>
}

export const getUseTokenQueryKey = (
  address: Params['address'],
  chainId: Params['chainId'],
) => ['erc20-token-complete', address, chainId]

export const useToken = function ({ address, chainId, options = {} }: Params) {
  const config = useConfig()

  const checksumAddress = toChecksumAddress(address as Address)

  return useQuery<Token, Error>({
    ...options,
    enabled:
      (options.enabled ?? true) &&
      !!address &&
      (isAddress(address, { strict: false }) || isNativeAddress(address)),
    queryFn: async () =>
      getTokenByAddress(checksumAddress, chainId) ??
      // up to this point, chainId must be an EVM one because we checked for native addresses
      (getErc20Token({
        address: checksumAddress as Address,
        chainId: chainId as Chain['id'],
        config,
      }) satisfies Promise<Token>),
    queryKey: getUseTokenQueryKey(checksumAddress, chainId),
  })
}
