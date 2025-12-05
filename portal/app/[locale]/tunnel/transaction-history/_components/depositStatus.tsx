import { useTranslations } from 'next-intl'
import { ReactNode } from 'react'
import Skeleton from 'react-loading-skeleton'
import {
  BtcDepositStatus,
  DepositTunnelOperation,
  EvmDepositStatus,
  type EvmDepositStatusType,
  ExpectedWaitTimeMinutesGetFundsHemi,
} from 'types/tunnel'
import { isBtcDeposit } from 'utils/tunnel'

import { TxStatus } from './txStatus'

type Props = {
  deposit: DepositTunnelOperation
}

export const DepositStatus = function ({ deposit }: Props) {
  const t = useTranslations()

  if (!isBtcDeposit(deposit)) {
    const evmStatuses: Partial<Record<EvmDepositStatusType, ReactNode>> = {
      [EvmDepositStatus.DEPOSIT_TX_CONFIRMED]: (
        <TxStatus.InStatus
          text={t('common.wait-minutes', {
            minutes: ExpectedWaitTimeMinutesGetFundsHemi,
          })}
        />
      ),
      // Check if funds have been minted in Hemi
      [EvmDepositStatus.DEPOSIT_RELAYED]: <TxStatus.Success />,
    }

    const skeleton = <Skeleton className="w-15 h-8" />

    if (deposit.status === undefined) {
      return skeleton
    }
    return evmStatuses[deposit.status] ?? skeleton
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
