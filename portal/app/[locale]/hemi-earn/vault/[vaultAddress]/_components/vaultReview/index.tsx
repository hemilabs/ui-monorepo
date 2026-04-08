'use client'

import { Drawer } from 'components/drawer'

import { useVaultForm } from '../../_context/vaultFormContext'
import { useDrawerVaultQueryString } from '../../_hooks/useDrawerVaultQueryString'

import { ReviewDeposit } from './reviewDeposit'
import { ReviewWithdraw } from './reviewWithdraw'

type Props = {
  closeDrawer: VoidFunction
}

export const VaultReview = function ({ closeDrawer }: Props) {
  const { drawerMode } = useDrawerVaultQueryString()
  const { depositOperation, withdrawOperation } = useVaultForm()

  const renderContent = function () {
    if (drawerMode === 'depositing' && depositOperation) {
      return <ReviewDeposit onClose={closeDrawer} />
    }
    if (drawerMode === 'withdrawing' && withdrawOperation) {
      return <ReviewWithdraw onClose={closeDrawer} />
    }
    return null
  }

  return (
    <Drawer onClose={closeDrawer}>
      <div className="drawer-content h-[80dvh] md:h-full">
        {renderContent()}
      </div>
    </Drawer>
  )
}
