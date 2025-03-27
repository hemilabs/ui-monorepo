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
    [BtcDepositStatus.BTC_TX_PENDING]: (
      <TxStatus.InStatus text={t('transaction-history.waiting-confirmation')} />
    ),
    [BtcDepositStatus.BTC_TX_CONFIRMED]: (
      <TxStatus.InStatus
        text={t.rich('common.wait-hours', {
          hours: () =>
            t('common.hours', {
              hours: 3,
            }),
        })}
      />
    ),
    [BtcDepositStatus.READY_TO_MANUAL_CONFIRM]: (
      <TxStatus.InStatus text={t('transaction-history.ready-to-confirm')} />
    ),
    [BtcDepositStatus.DEPOSIT_MANUAL_CONFIRMING]: (
      <TxStatus.InStatus text={t('transaction-history.confirming')} />
    ),
    [BtcDepositStatus.DEPOSIT_MANUAL_CONFIRMATION_TX_FAILED]: (
      <TxStatus.Failed />
    ),
    [BtcDepositStatus.BTC_TX_FAILED]: <TxStatus.Failed />,
    [BtcDepositStatus.BTC_DEPOSITED_MANUALLY]: <TxStatus.Success />,
    [BtcDepositStatus.BTC_DEPOSITED]: <TxStatus.Success />,
  }

  return statuses[deposit.status] ?? '-'
}
