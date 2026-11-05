import { useQuery } from '@tanstack/react-query'
import { type Address } from 'viem'
import { useAccount } from 'wagmi'

import { maxWithdrawableAssetOptions } from '../_fetchers/fetchMaxWithdrawableAsset'

export const useMaxWithdrawableAsset = function ({
  assetAddress,
  shareAddress,
}: {
  assetAddress: Address
  shareAddress: Address
}) {
  const { address } = useAccount()
  return useQuery(
    maxWithdrawableAssetOptions({
      account: address,
      assetAddress,
      shareAddress,
    }),
  )
}
