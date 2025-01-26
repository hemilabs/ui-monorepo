'use client'

import { featureFlags } from 'app/featureFlags'
import { isBtcTxHash } from 'btc-wallet/utils/hash'
import { Drawer } from 'components/drawer'
import { TransactionsInProgressContext } from 'context/transactionsInProgressContext'
import { useDeposits } from 'hooks/useDeposits'
import { useWithdrawals } from 'hooks/useWithdrawals'
import { Suspense, useContext } from 'react'
import { isDeposit } from 'utils/tunnel'
import { isHash } from 'viem'

import { useTunnelOperation } from '../_hooks/useTunnelOperation'

import { ViewDeposit } from './reviewOperation/viewDeposit'
import { ViewWithdrawal } from './reviewOperation/viewWithdrawal'

const useGetTunnelOperation = function () {
  const { transactions } = useContext(TransactionsInProgressContext)
  const deposits = useDeposits()
  const { txHash } = useTunnelOperation()
  const withdrawals = useWithdrawals()

  if (!txHash) {
    return undefined
  }

  return (
    deposits.find(d => d.transactionHash === txHash) ??
    withdrawals.find(d => d.transactionHash === txHash) ??
    // For erc20 deposits which include an approval tx operation, we temporarily use that hash
    // to be able to show the operation in the drawer. Note that it is not in the tunnel history as
    // if the ERC20 approval step fails, we don't want to show it in the history.
    transactions.find(d => d.transactionHash === txHash)
  )
}

const Operation = function () {
  const tunnelOperation = useGetTunnelOperation()
  const { txHash, updateTxHash } = useTunnelOperation()

  const isEvmTx = isHash(txHash)
  const isBtcTx = featureFlags.btcTunnelEnabled && isBtcTxHash(txHash)

  if (!txHash || (!isEvmTx && !isBtcTx) || !tunnelOperation) {
    return null
  }

  const onClose = function () {
    updateTxHash(null)
  }

  return (
    <Drawer onClose={onClose}>
      <div className="drawer-content h-[80dvh] w-full md:h-full md:w-[450px]">
        {isDeposit(tunnelOperation) ? (
          <ViewDeposit deposit={tunnelOperation} onClose={onClose} />
        ) : (
          <ViewWithdrawal onClose={onClose} withdrawal={tunnelOperation} />
        )}
      </div>
    </Drawer>
  )
}

export const ViewOperation = () => (
  <Suspense>
    <Operation />
  </Suspense>
)
