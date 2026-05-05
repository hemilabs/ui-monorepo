'use client'

import { Drawer } from 'components/drawer'
import { Spinner } from 'components/spinner'
import { useAmount } from 'hooks/useAmount'
import dynamic from 'next/dynamic'

import { useOperationDrawer } from '../_hooks/useOperationDrawer'

const OperationLoadingFallback = () => (
  <div className="drawer-content flex h-full w-full flex-col items-center justify-center py-16">
    <Spinner size="medium" variant="orange" />
  </div>
)

const VaultDepositOperation = dynamic(
  () =>
    import('./vaultDepositOperation').then(mod => mod.VaultDepositOperation),
  {
    loading: () => <OperationLoadingFallback />,
    ssr: false,
  },
)

const VaultWithdrawalOperation = dynamic(
  () =>
    import('./vaultWithdrawalOperation').then(
      mod => mod.VaultWithdrawalOperation,
    ),
  {
    loading: () => <OperationLoadingFallback />,
    ssr: false,
  },
)

const VaultClaimRewardOperation = dynamic(
  () =>
    import('./vaultClaimRewardOperation').then(
      mod => mod.VaultClaimRewardOperation,
    ),
  {
    loading: () => <OperationLoadingFallback />,
    ssr: false,
  },
)

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
