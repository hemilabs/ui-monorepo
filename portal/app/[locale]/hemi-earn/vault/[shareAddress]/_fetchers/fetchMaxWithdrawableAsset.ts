import { queryOptions } from '@tanstack/react-query'
import { type Address } from 'viem'

import { sharesToAssetsOptions } from './fetchSharesToAssets'
import { userShareValueOptions } from './fetchUserShareValue'

type MaxWithdrawableAssetParams = {
  account: Address | undefined
  assetAddress: Address
  shareAddress: Address
}

const getMaxWithdrawableAssetQueryKey = ({
  account,
  assetAddress,
  shareAddress,
}: MaxWithdrawableAssetParams) =>
  [
    'hemi-earn',
    'max-withdrawable-asset',
    shareAddress,
    assetAddress,
    account,
  ] as const

export const maxWithdrawableAssetOptions = ({
  account,
  assetAddress,
  shareAddress,
}: MaxWithdrawableAssetParams) =>
  queryOptions({
    enabled: !!account,
    async queryFn({ client }) {
      const { shares } = await client.ensureQueryData(
        userShareValueOptions({ account, queryClient: client, shareAddress }),
      )
      if (shares <= BigInt(0)) {
        return { assetOut: BigInt(0) }
      }
      const { assetOut } = await client.ensureQueryData(
        sharesToAssetsOptions({
          assetAddress,
          queryClient: client,
          shareAddress,
          shares,
        }),
      )
      return { assetOut }
    },
    queryKey: getMaxWithdrawableAssetQueryKey({
      account,
      assetAddress,
      shareAddress,
    }),
  })
