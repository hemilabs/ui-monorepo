import { useTranslations } from 'next-intl'
import { BtcDepositStatus, DepositTunnelOperation } from 'types/tunnel'
import { isBtcDeposit } from 'utils/tunnel'

import { TxStatus } from './txStatus'

type Props = {
  deposit: DepositTunnelOperation
}

export const DepositStatus = function ({ deposit }: Props) {
  const t = useTranslations()

  if (!isBtcDeposit(deposit)) {
    // Evm deposits are always successful if listed
    return <TxStatus.Success />
  }
  const statuses = {
    [BtcDepositStatus.TX_PENDING]: (
      <TxStatus.InStatus text={t('transaction-history.waiting-confirmation')} />
    ),
    [BtcDepositStatus.TX_CONFIRMED]: (
      <TxStatus.InStatus text={t('common.wait-hours', { hours: 2 })} />
    ),
    [BtcDepositStatus.BTC_READY_CLAIM]: (
      <TxStatus.InStatus text={t('transaction-history.ready-to-claim')} />
    ),
    [BtcDepositStatus.BTC_DEPOSITED]: <TxStatus.Success />,
  }

  return statuses[deposit.status] ?? '-'
}
