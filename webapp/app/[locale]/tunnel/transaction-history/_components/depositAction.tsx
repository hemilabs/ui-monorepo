import {
  BtcDepositStatus,
  DepositTunnelOperation,
} from 'context/tunnelHistoryContext/types'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { isEvmDeposit } from 'utils/tunnel'

import { CallToAction } from './callToAction'

type Props = {
  deposit: DepositTunnelOperation
}

export const DepositAction = function ({ deposit }: Props) {
  const t = useTranslations('tunnel-page.transaction-history.actions')

  if (isEvmDeposit(deposit)) {
    return (
      // EVM Deposits do not render an action, rendering a "-"
      <span className="opacity-40">-</span>
    )
  }

  if (deposit.status === undefined) {
    return <Skeleton className="h-9 w-24" />
  }

  const getViewButton = (operation: string) => (
    <CallToAction
      className="border border-solid border-slate-50 bg-slate-100 text-slate-950"
      operation={operation}
      text={t('view')}
      txHash={deposit.transactionHash}
    />
  )

  const Claim = (
    <CallToAction
      operation="claim"
      text={t('claim')}
      txHash={deposit.transactionHash}
    />
  )

  const actions = {
    [BtcDepositStatus.TX_PENDING]: getViewButton('deposit'),
    [BtcDepositStatus.TX_CONFIRMED]: getViewButton('deposit'),
    [BtcDepositStatus.BTC_READY_CLAIM]: Claim,
    [BtcDepositStatus.BTC_DEPOSITED]: getViewButton('view'),
  }

  return actions[deposit.status]
}
