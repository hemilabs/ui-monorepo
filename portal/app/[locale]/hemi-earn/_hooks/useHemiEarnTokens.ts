'use client'

import { hemi, hemiSepolia } from 'hemi-viem'
import { useHemi } from 'hooks/useHemi'
import { useMemo } from 'react'
import { tokenList } from 'tokenList'
import { toChecksumAddress } from 'utils/address'

// TODO: replace with vault.asset() calls when earn vaults are deployed
const EARN_TOKEN_ADDRESSES: Partial<Record<number, string[]>> = {
  [hemi.id]: [
    toChecksumAddress('0xAA40c0c7644e0b2B224509571e10ad20d9C4ef28'), // hemiBTC
    toChecksumAddress('0xad11a8BEb98bbf61dbb1aa0F6d6F2ECD87b35afA'), // USDC.e
  ],
  [hemiSepolia.id]: [
    toChecksumAddress('0xD47971C7F5B1067d25cd45d30b2c9eb60de96443'), // USDC.e
  ],
}

export const useHemiEarnTokens = function () {
  const { id } = useHemi()

  return useMemo(
    () =>
      tokenList.tokens.filter(
        t =>
          t.chainId === id &&
          (EARN_TOKEN_ADDRESSES[id] ?? []).includes(t.address),
      ),
    [id],
  )
}
