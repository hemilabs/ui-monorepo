'use client'

import { useQuery } from '@tanstack/react-query'
import { useNetworkType } from 'hooks/useNetworkType'
import { type Address } from 'viem'

import { type EarnPool } from '../types'

import { useHemiEarnTokens } from './useHemiEarnTokens'

export const earnPoolsKeyPrefix = ['hemi-earn', 'pools']

// TODO(phase-2): mocked intentionally. APY and TVL (`totalAssets`) live on the
// sVetBTC StakingVault on Ethereum, so this hook will need to read cross-chain
// (RPC Ethereum or a subgraph). Out of scope for the Router refactor. Returns
// zero APY/TVL so the pools table renders with placeholder values.
export const useEarnPools = function () {
  const [networkType] = useNetworkType()
  const { data: vaultTokens = [] } = useHemiEarnTokens()

  return useQuery<EarnPool[]>({
    enabled: vaultTokens.length > 0,
    queryFn: () =>
      vaultTokens.map(({ token, vaultAddress }, index) => ({
        apy: { base: 0, incentivized: 0, total: 0 },
        exposureTokens:
          vaultTokens[(index + 1) % vaultTokens.length]?.token.address !==
          token.address
            ? [
                { address: token.address as Address, chainId: token.chainId },
                {
                  address: vaultTokens[(index + 1) % vaultTokens.length].token
                    .address as Address,
                  chainId:
                    vaultTokens[(index + 1) % vaultTokens.length].token.chainId,
                },
              ]
            : [{ address: token.address as Address, chainId: token.chainId }],
        token,
        totalDeposits: BigInt(0),
        vaultAddress,
      })),
    queryKey: [
      ...earnPoolsKeyPrefix,
      networkType,
      ...vaultTokens.map(vt => vt.vaultAddress),
    ],
  })
}
