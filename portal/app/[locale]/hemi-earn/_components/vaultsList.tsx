import Skeleton from 'react-loading-skeleton'

import { useEarnVaults } from '../_hooks/useEarnVaults'

import { VaultInfoBar } from './vaultInfoBar'

const VaultInfoBarSkeleton = () => (
  <Skeleton className="h-58 w-full rounded-xl md:h-19.5" />
)

export const VaultsList = function () {
  const { data: vaults = [], isPending } = useEarnVaults()

  if (!isPending) {
    return (
      <div className="flex flex-col gap-4">
        {vaults.map(vault => (
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
