'use client'

import {
  useAccountModal,
  useChainModal,
  useConnectModal,
} from '@rainbow-me/rainbowkit'
import { Drawer } from 'components/drawer'

import { Review } from './review'

type Props = {
  closeDrawer: VoidFunction
}

export const StakeReview = function ({ closeDrawer }: Props) {
  const { accountModalOpen } = useAccountModal()
  const { chainModalOpen } = useChainModal()
  const { connectModalOpen } = useConnectModal()

  // Prevent closing the drawer when a RainbowKit modal is open.
  // Without this check, clicks on the wallet modal (e.g., Connect Wallet)
  // are interpreted as outside clicks and trigger onClose unintentionally.
  function safeCloseDrawer() {
    if (accountModalOpen || chainModalOpen || connectModalOpen) return
    closeDrawer()
  }

  return (
    <Drawer onClose={safeCloseDrawer}>
      <div className="drawer-content h-[80dvh] md:h-full">
        <Review onClose={safeCloseDrawer} />
      </div>
    </Drawer>
  )
}
