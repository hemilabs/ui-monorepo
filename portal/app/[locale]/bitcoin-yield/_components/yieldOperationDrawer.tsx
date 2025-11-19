'use client'

import {
  useAccountModal,
  useChainModal,
  useConnectModal,
} from '@rainbow-me/rainbowkit'
import { Drawer } from 'components/drawer'
import { useAmount } from 'hooks/useAmount'

import { useOperationDrawer } from '../_hooks/useOperationDrawer'

import { VaultDepositOperation } from './vaultDepositOperation'

export const YieldOperationDrawer = function () {
  const { accountModalOpen } = useAccountModal()
  const { chainModalOpen } = useChainModal()
  const { connectModalOpen } = useConnectModal()
  const [operation, setOperationDrawer] = useOperationDrawer()

  const [amount, onAmountChange] = useAmount()

  const closeDrawer = () => setOperationDrawer(null)

  // Prevent closing the drawer when a RainbowKit modal is open.
  // Without this check, clicks on the wallet modal (e.g., Connect Wallet)
  // are interpreted as outside clicks and trigger onClose unintentionally.
  function safeCloseDrawer() {
    if (accountModalOpen || chainModalOpen || connectModalOpen) {
      return
    }
    closeDrawer()
  }

  return (
    <Drawer onClose={safeCloseDrawer}>
      {operation === 'deposit' && (
        <VaultDepositOperation
          input={amount}
          onAmountChange={onAmountChange}
          onClose={safeCloseDrawer}
        />
      )}
    </Drawer>
  )
}
