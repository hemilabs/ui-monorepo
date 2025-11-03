import { hemiSepolia } from 'hemi-viem'
import { useHemi } from 'hooks/useHemi'
import { useMemo } from 'react'
import { tokenList } from 'tokenList'
import { EvmToken } from 'types/token'
import type { Address, Chain } from 'viem'

import { useRewardTokensAddresses as useRewardTokensQuery } from './useRewardTokensAddresses'

export type RewardTokenConfig = {
  address: Address
  chainId: Chain['id']
  decimals: number
  symbol: string
}

// These tokens should be removed once the tests with simulated data are completed.
const rewardTokensMap: Record<Chain['id'], RewardTokenConfig[]> = {
  [hemiSepolia.id]: [
    {
      address: '0x2315ab2800c25D0f932dD7f5D15CeA43cAA614Dd',
      chainId: hemiSepolia.id,
      decimals: 18,
      symbol: 'HEMI',
    },
    {
      address: '0x7270A269B6236038de02dBE39Ca1e7DA8d562Dcd',
      chainId: hemiSepolia.id,
      decimals: 18,
      symbol: 'hemiBTC',
    },
  ],
}

export const useRewardTokens = function () {
  const { id } = useHemi()

  const { data: rewardTokenAddresses = [], isLoading } = useRewardTokensQuery({
    chainId: id,
  })

  const fallbackTokens = useMemo(() => rewardTokensMap[id] || [], [id])

  return useMemo(
    function () {
      const tokens: EvmToken[] = rewardTokenAddresses
        .map((address: Address) =>
          tokenList.tokens.find(
            t =>
              t.address.toLowerCase() === address.toLowerCase() &&
              t.chainId === id,
          ),
        )
        .filter((t): t is EvmToken => t !== undefined)

      if (tokens.length === 0) {
        return { isLoading, tokens: fallbackTokens }
      }

      return { isLoading, tokens }
    },
    [rewardTokenAddresses, isLoading, id, fallbackTokens],
  )
}
