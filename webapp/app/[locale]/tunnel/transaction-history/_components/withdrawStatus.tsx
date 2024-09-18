import { MessageStatus } from '@eth-optimism/sdk'
import { useTranslations } from 'next-intl'
import { EvmWithdrawOperation } from 'types/tunnel'

import { TxStatus } from './txStatus'

type Props = {
  withdrawal: EvmWithdrawOperation
}

export const WithdrawStatus = function ({ withdrawal }: Props) {
  const t = useTranslations()
  const waitMinutes = t('common.wait-minutes', { minutes: 20 })
  const statuses = {
    // This status should never be rendered, but just to be defensive
    // let's render the next status:
    [MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE]: (
      <TxStatus.InStatus text={waitMinutes} />
    ),
    [MessageStatus.FAILED_L1_TO_L2_MESSAGE]: <TxStatus.Failed />,
    [MessageStatus.STATE_ROOT_NOT_PUBLISHED]: (
      <TxStatus.InStatus text={waitMinutes} />
    ),
    [MessageStatus.READY_TO_PROVE]: (
      <TxStatus.InStatus text={t('transaction-history.ready-to-prove')} />
    ),
    [MessageStatus.IN_CHALLENGE_PERIOD]: (
      <TxStatus.InStatus text={t('transaction-history.in-challenge-period')} />
    ),
    [MessageStatus.READY_FOR_RELAY]: (
      <TxStatus.InStatus text={t('transaction-history.ready-to-claim')} />
    ),
    [MessageStatus.RELAYED]: <TxStatus.Success />,
  }

  return statuses[withdrawal.status]
}
