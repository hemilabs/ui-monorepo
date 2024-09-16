import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { BtcDepositStatus, DepositTunnelOperation } from 'types/tunnel'
import { isEvmDeposit } from 'utils/tunnel'

import { CallToAction } from './callToAction'

type Props = {
  deposit: DepositTunnelOperation
}

export const DepositAction = function ({ deposit }: Props) {
  const t = useTranslations('tunnel-page.transaction-history.actions')

  const getViewButton = (operation: string) => (
    <CallToAction
      operation={operation}
      text={t('view')}
      txHash={deposit.transactionHash}
      variant="secondary"
    />
  )

  if (isEvmDeposit(deposit)) {
    return getViewButton('view')
  }

  if (deposit.status === undefined) {
    return <Skeleton className="h-9 w-24" />
  }

  const Claim = (
    <CallToAction
      operation="claim"
      text={t('claim')}
      txHash={deposit.transactionHash}
      variant="primary"
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
