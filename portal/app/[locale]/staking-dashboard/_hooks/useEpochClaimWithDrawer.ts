import { useMemo } from 'react'

import { useClaimRewardsWalkthrough } from './useClaimRewardsWalkthrough'
import { useEpochClaimableByToken } from './useEpochClaimableByToken'

// Claims one position's epoch rewards - a walk of length one. The row menu and the
// drawer's retry come through here; claim-all uses the same engine with more positions.
export const useEpochClaimWithDrawer = function ({
  amount,
  owner,
  tokenId,
}: {
  amount: bigint
  owner: string
  tokenId: bigint
}) {
  const { data: claimable } = useEpochClaimableByToken(tokenId)

  const totals = useMemo(
    () =>
      claimable
        ?.filter(row => row.claimable > BigInt(0))
        .map(({ claimable: amountClaimable, decimals, symbol, token }) => ({
          claimable: amountClaimable,
          decimals,
          symbol,
          token,
        })),
    [claimable],
  )

  const targets = useMemo(
    () => [{ amount, owner, tokenId }],
    [amount, owner, tokenId],
  )

  return useClaimRewardsWalkthrough({ targets, totals })
}
