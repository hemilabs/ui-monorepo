import { useEarnVaults } from '../_hooks/useEarnVaults'
import { getListedVaults } from '../_utils/vaults'

import { VaultInfoBar } from './vaultInfoBar'
import { VaultInfoBarSkeleton } from './vaultInfoBarSkeleton'

export const VaultsList = function () {
  const { data: vaults } = useEarnVaults()

  if (vaults) {
    return (
      <div className="flex flex-col gap-4">
        {getListedVaults(vaults).map(vault => (
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
