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

// Once eligible, stay so for the same wallet and vault: finishing a withdrawal
// must not redirect mid-flow, but switching or disconnecting the wallet
// re-checks access.
const useAccessGrant = function ({
  account,
  isEligible,
  shareAddress,
}: {
  account: Address | undefined
  isEligible: boolean
  shareAddress: string
}) {
  const [grantedKey, setGrantedKey] = useState<string>()
  const grantKey = account ? `${account}:${shareAddress}` : undefined

  useEffect(
    function grantAccess() {
      if (isEligible && grantKey) {
        setGrantedKey(grantKey)
      }
    },
    [grantKey, isEligible],
  )

  return isEligible || (grantKey !== undefined && grantedKey === grantKey)
}

// Resolves the page's vault, gated by canAccessVault: a delisted vault is only
// reachable while the wallet still has something to withdraw or claim from it.
export const useAccessibleVault = function (shareAddress: string) {
  const { address } = useAccount()
  const { data: vaults } = useEarnVaults()
  const { data: positions } = useEarnPositions()
  const { data: inTransitByShare } = useInTransitShares()
  const { data: transactions } = useEarnTransactions()
  const isAccessPending = useIsAccessPending()

  const foundVault = vaults
    ? findVaultByShare(vaults, shareAddress as Address)
    : undefined

  const isEligible =
    !!foundVault &&
    canAccessVault({
      inTransitByShare,
      nowSec: Number(unixNowTimestamp()),
      positions,
      transactions,
      vault: foundVault,
    })
  const hasAccess =
    useAccessGrant({ account: address, isEligible, shareAddress }) &&
    !!foundVault

  const isNotFound = vaults !== undefined && !foundVault
  const isNotAccessible = !!foundVault && !hasAccess && !isAccessPending

  return {
    shouldRedirect: isNotFound || isNotAccessible,
    vault: hasAccess ? foundVault : undefined,
  }
}
