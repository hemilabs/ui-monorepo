import { useEffect, useState } from 'react'
import { unixNowTimestamp } from 'utils/time'
import { type Address } from 'viem'
import { useAccount } from 'wagmi'

import { useEarnPositions } from '../../../_hooks/useEarnPositions'
import { useEarnTransactions } from '../../../_hooks/useEarnTransactions'
import { useEarnVaults } from '../../../_hooks/useEarnVaults'
import { useInTransitShares } from '../../../_hooks/useInTransitShares'
import { canAccessVault, findVaultByShare } from '../../../_utils/vaults'

const useIsAccessPending = function () {
  const { status: accountStatus } = useAccount()
  const { isPending: arePositionsPending } = useEarnPositions()
  const { isPending: isInTransitPending } = useInTransitShares()
  const { isPending: areTransactionsPending } = useEarnTransactions()

  return (
    accountStatus === 'connecting' ||
    accountStatus === 'reconnecting' ||
    arePositionsPending ||
    isInTransitPending ||
    areTransactionsPending
  )
}

// Resolves the page's vault, gated by canAccessVault: a delisted vault is only
// reachable while the wallet still has something to withdraw or claim from it.
export const useAccessibleVault = function (shareAddress: string) {
  const { data: vaults } = useEarnVaults()
  const { data: positions } = useEarnPositions()
  const { data: inTransitByShare } = useInTransitShares()
  const { data: transactions } = useEarnTransactions()
  const isAccessPending = useIsAccessPending()
  // Once reachable, stay so: finishing a withdrawal must not redirect mid-flow.
  const [grantedShareAddress, setGrantedShareAddress] = useState<string>()

  const foundVault = vaults
    ? findVaultByShare(vaults, shareAddress as Address)
    : undefined

  const hasAccess =
    !!foundVault &&
    (grantedShareAddress === shareAddress ||
      canAccessVault({
        inTransitByShare,
        nowSec: Number(unixNowTimestamp()),
        positions,
        transactions,
        vault: foundVault,
      }))

  useEffect(
    function grantAccess() {
      if (hasAccess) {
        setGrantedShareAddress(shareAddress)
      }
    },
    [hasAccess, shareAddress],
  )

  const isNotFound = vaults !== undefined && !foundVault
  const isNotAccessible = !!foundVault && !hasAccess && !isAccessPending

  return {
    shouldRedirect: isNotFound || isNotAccessible,
    vault: hasAccess ? foundVault : undefined,
  }
}
