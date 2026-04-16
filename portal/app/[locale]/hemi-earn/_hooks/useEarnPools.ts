'use client'

import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNetworkType } from 'hooks/useNetworkType'
import { type Address, type Chain, type PublicClient } from 'viem'
import { totalAssets } from 'viem-erc4626/actions'
import { useConfig } from 'wagmi'
import { getPublicClient } from 'wagmi/actions'

import { type EarnPool, type VaultToken } from '../types'

import { useHemiEarnTokens } from './useHemiEarnTokens'

export const earnPoolsKeyPrefix = ['hemi-earn', 'pools']

const getEarnPoolsQueryKey = (chainId: Chain['id']) => [
  ...earnPoolsKeyPrefix,
  chainId,
]

export const earnPoolsQueryOptions = ({
  chainId,
  client,
  vaultTokens,
}: {
  chainId: Chain['id']
  client: PublicClient
  vaultTokens: VaultToken[]
}) =>
  queryOptions<EarnPool[]>({
    async queryFn() {
      const deposits = await Promise.all(
        vaultTokens.map(({ vaultAddress }) =>
          totalAssets(client, { address: vaultAddress }),
        ),
      )

      // TODO: apy requires off-chain data once available
      // TODO: exposure tokens are not finalized — using pool token + counterpart as placeholder
      return vaultTokens.map(({ token, vaultAddress }, index) => ({
        apy: { base: 0, incentivized: 0, total: 0 },
        exposureTokens: (vaultTokens[(index + 1) % vaultTokens.length]?.token
          .address !== token.address
          ? [
              { address: token.address as Address, chainId: token.chainId },
              {
                address: vaultTokens[(index + 1) % vaultTokens.length].token
                  .address as Address,
                chainId:
                  vaultTokens[(index + 1) % vaultTokens.length].token.chainId,
              },
            ]
          : [
              { address: token.address as Address, chainId: token.chainId },
            ]) satisfies EarnPool['exposureTokens'],
        token,
        totalDeposits: deposits[index] ?? BigInt(0),
        vaultAddress,
      }))
    },
    queryKey: getEarnPoolsQueryKey(chainId),
  })

export const groupByChain = (vaultTokens: VaultToken[]) =>
  Map.groupBy(vaultTokens, vt => vt.token.chainId)

export const useEarnPools = function () {
  const [networkType] = useNetworkType()
  const config = useConfig()
  const queryClient = useQueryClient()
  const { data: vaultTokens = [] } = useHemiEarnTokens()

  return useQuery<EarnPool[]>({
    enabled: vaultTokens.length > 0,
    async queryFn() {
      const perChainPools = await Promise.all(
        Array.from(groupByChain(vaultTokens).entries()).map(
          ([chainId, tokens]) =>
            queryClient.ensureQueryData(
              earnPoolsQueryOptions({
                chainId,
                client: getPublicClient(config, { chainId })!,
                vaultTokens: tokens,
              }),
            ),
        ),
      )
      return perChainPools.flat()
    },
    queryKey: [
      ...earnPoolsKeyPrefix,
      networkType,
      ...vaultTokens.map(vt => vt.vaultAddress),
    ],
  })
}
