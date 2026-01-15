'use client'

import { Drawer } from 'components/drawer'
import { useAmount } from 'hooks/useAmount'

import { useOperationDrawer } from '../_hooks/useOperationDrawer'

import { VaultClaimRewardOperation } from './vaultClaimRewardOperation'
import { VaultDepositOperation } from './vaultDepositOperation'
import { VaultWithdrawalOperation } from './vaultWithdrawalOperation'

export const YieldOperationDrawer = function () {
  const [operation, setOperationDrawer] = useOperationDrawer()

  const [amount, onAmountChange] = useAmount()

  const closeDrawer = () => setOperationDrawer(null)

  return (
    <Drawer onClose={closeDrawer}>
      {operation === 'deposit' && (
        <VaultDepositOperation
          input={amount}
          onAmountChange={onAmountChange}
          onClose={closeDrawer}
        />
      )}
      {operation === 'withdraw' && (
        <VaultWithdrawalOperation
          input={amount}
          onAmountChange={onAmountChange}
          onClose={closeDrawer}
        />
      )}
      {operation === 'claim' && (
        <VaultClaimRewardOperation onClose={closeDrawer} />
      )}
    </Drawer>
  )
}
