'use client'

import {
  useAccountModal,
  useChainModal,
  useConnectModal,
} from '@rainbow-me/rainbowkit'
import { Drawer } from 'components/drawer'

import { useDrawerStakingQueryString } from '../../_hooks/useDrawerStakingQueryString'

import { ReviewStake } from './reviewStake'
import { ReviewUnlock } from './reviewUnlock'

type Props = {
  closeDrawer: VoidFunction
}

export const StakeReview = function ({ closeDrawer }: Props) {
  const { accountModalOpen } = useAccountModal()
  const { chainModalOpen } = useChainModal()
  const { connectModalOpen } = useConnectModal()
  const { drawerMode } = useDrawerStakingQueryString()

  // Prevent closing the drawer when a RainbowKit modal is open.
  // Without this check, clicks on the wallet modal (e.g., Connect Wallet)
  // are interpreted as outside clicks and trigger onClose unintentionally.
  function safeCloseDrawer() {
    if (accountModalOpen || chainModalOpen || connectModalOpen) return
    closeDrawer()
  }

  const isStaking = drawerMode === 'staking'

  return (
    <Drawer onClose={safeCloseDrawer}>
      <div className="drawer-content h-[80dvh] md:h-full">
        {isStaking ? (
          <ReviewStake onClose={safeCloseDrawer} />
        ) : (
          <ReviewUnlock onClose={safeCloseDrawer} />
        )}
      </div>
    </Drawer>
  )
}
