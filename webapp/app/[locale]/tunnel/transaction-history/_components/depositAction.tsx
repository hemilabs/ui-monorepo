import { useNetworkType } from 'hooks/useNetworkType'
import { useTranslations } from 'next-intl'
import { BtcDepositStatus, DepositTunnelOperation } from 'types/tunnel'
import { isBtcDeposit } from 'utils/tunnel'

import { CallToAction } from './callToAction'

type Props = {
  deposit: DepositTunnelOperation
}

export const DepositAction = function ({ deposit }: Props) {
  const [networkType] = useNetworkType()
  const t = useTranslations('tunnel-page.transaction-history.actions')

  // All buttons show a "view" button, except for the "ready to confirm" in bitcoin
  if (
    isBtcDeposit(deposit) &&
    deposit.status === BtcDepositStatus.READY_TO_MANUAL_CONFIRM
  ) {
    return (
      <CallToAction
        networkType={networkType}
        text={t('confirm')}
        txHash={deposit.transactionHash}
        variant="primary"
      />
    )
  }

  return (
    <CallToAction
      networkType={networkType}
      text={t('view')}
      txHash={deposit.transactionHash}
      variant="secondary"
    />
  )
}
