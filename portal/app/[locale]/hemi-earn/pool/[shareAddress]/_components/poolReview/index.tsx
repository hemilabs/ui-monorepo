'use client'

import { Drawer } from 'components/drawer'

import { usePoolForm } from '../../_context/poolFormContext'
import { useDrawerQueryString } from '../../_hooks/useDrawerQueryString'

import { ReviewDeposit } from './reviewDeposit'
import { ReviewWithdraw } from './reviewWithdraw'

type Props = {
  closeDrawer: VoidFunction
}

export const PoolReview = function ({ closeDrawer }: Props) {
  const { drawerMode } = useDrawerQueryString()
  const { depositOperation, withdrawOperation } = usePoolForm()

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
