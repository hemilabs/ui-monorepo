import { useHemi } from 'hooks/useHemi'
import { useMemo } from 'react'
import { EvmToken } from 'types/token'
import { getTokenByAddress } from 'utils/token'
import { type Address, type Chain } from 'viem'
import { hemi, hemiSepolia } from 'viem/chains'

const HEMI_BTC_ADDRESSES: Record<Chain['id'], Address> = {
  [hemi.id]: '0xAA40c0c7644e0b2B224509571e10ad20d9C4ef28',
  [hemiSepolia.id]: '0x36Ab5Dba83d5d470F670BC4c06d7Da685d9afAe7',
}

export const useHemiBtcToken = function () {
  const hemiChain = useHemi()

  return useMemo(
    function () {
      const address =
        HEMI_BTC_ADDRESSES[hemiChain.id as keyof typeof HEMI_BTC_ADDRESSES]
      if (!address) {
        throw new Error(
          `HemiBTC token address not found for chain ID: ${hemiChain.id}`,
        )
      }
      // hemiBTC is always an EvmToken
      return getTokenByAddress(address, hemiChain.id) as EvmToken
    },
    [hemiChain.id],
  )
}
