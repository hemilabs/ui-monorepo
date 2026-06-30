import { type Address } from 'viem'

import { useSharesToAssets } from './useSharesToAssets'
import { useUserShareValue } from './useUserShareValue'

export const useMaxWithdrawableAsset = function ({
  assetAddress,
  shareAddress,
}: {
  assetAddress: Address
  shareAddress: Address
}) {
  const { data: shareValue, isSuccess: shareValueLoaded } = useUserShareValue({
    shareAddress,
  })
  const shareBalance = shareValue?.shares ?? BigInt(0)

  const { data, status } = useSharesToAssets({
    assetAddress,
    shareAddress,
    shares: shareBalance,
  })

  return {
    assetOut: shareBalance > BigInt(0) ? data?.assetOut : BigInt(0),
    isLoaded:
      shareValueLoaded && (shareBalance === BigInt(0) || status !== 'pending'),
    shareBalance,
    shareValueLoaded,
    status,
  }
}
