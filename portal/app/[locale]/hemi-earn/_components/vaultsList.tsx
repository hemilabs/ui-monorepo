import Skeleton from 'react-loading-skeleton'

import { useEarnVaults } from '../_hooks/useEarnVaults'
import { getListedVaults } from '../_utils/vaults'

import { VaultInfoBar } from './vaultInfoBar'

const VaultInfoBarSkeleton = () => (
  <Skeleton className="h-64 w-full rounded-xl md:h-26" />
)

export const VaultsList = function () {
  const { data: vaults = [], isPending } = useEarnVaults()
  const listedVaults = getListedVaults(vaults)

  if (!isPending) {
    return (
      <div className="flex flex-col gap-4">
        {listedVaults.map(vault => (
          <VaultInfoBar key={vault.shareAddress} vault={vault} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <VaultInfoBarSkeleton />
    </div>
  )
}
