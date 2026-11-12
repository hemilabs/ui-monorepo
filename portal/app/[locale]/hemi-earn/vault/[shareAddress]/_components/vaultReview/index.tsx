import { Drawer } from 'components/drawer'

import { useDrawerQueryString } from '../../_hooks/useDrawerQueryString'

import { DepositTermsGate } from './depositTermsGate'
import { ReviewWithdraw } from './reviewWithdraw'

type Props = {
  closeDrawer: VoidFunction
}

export const VaultReview = function ({ closeDrawer }: Props) {
  const { drawerMode } = useDrawerQueryString()

  const renderContent = function () {
    if (drawerMode === 'depositing') {
      return <DepositTermsGate onClose={closeDrawer} />
    }
    if (drawerMode === 'withdrawing') {
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
