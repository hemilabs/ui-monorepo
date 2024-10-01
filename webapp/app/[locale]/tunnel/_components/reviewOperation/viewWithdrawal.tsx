'use client'

import { Drawer } from 'components/drawer'
import { WithdrawTunnelOperation } from 'types/tunnel'
import { isEvmOperation } from 'utils/tunnel'

import { useTunnelOperation } from '../../_hooks/useTunnelOperation'

type Props = {
  withdrawal: WithdrawTunnelOperation
}

// TODO will be implemented in incoming PRs
export const ViewWithdrawal = function ({ withdrawal }: Props) {
  const { updateTxHash } = useTunnelOperation()

  const onClose = function () {
    updateTxHash(null)
  }

  return (
    <Drawer onClose={onClose}>
      <div className="h-full w-80 bg-white">{`${
        isEvmOperation(withdrawal) ? 'EVM' : 'BTC'
      } Withdrawal ${withdrawal.transactionHash}`}</div>
    </Drawer>
  )
}
