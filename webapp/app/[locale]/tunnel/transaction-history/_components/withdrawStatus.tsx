import { MessageStatus } from '@eth-optimism/sdk'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { BtcWithdrawStatus, WithdrawTunnelOperation } from 'types/tunnel'
import { isToEvmWithdraw } from 'utils/tunnel'

import { TxStatus } from './txStatus'

type Props = {
  withdrawal: WithdrawTunnelOperation
}

const EvmWithdrawStatus = function ({ withdrawal }: Props) {
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

  return statuses[withdrawal.status] ?? <Skeleton className="w-12" />
}

// After the withdrawal is initiated, the operation is in a wait state for up to
// 12 hours. Past that time, if not completed, the operation can be challenged.
// Either way, it can be successful or have failed.
const BitcoinWithdrawStatus = function ({ withdrawal }: Props) {
  const t = useTranslations()

  const statuses = {
    // Happy path
    [BtcWithdrawStatus.INITIATE_WITHDRAW_PENDING]: (
      <TxStatus.InStatus text={t('common.wait-minutes', { minutes: 10 })} />
    ),
    [BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED]: (
      <TxStatus.InStatus text={t('common.wait-hours', { hours: 12 })} />
    ),
    [BtcWithdrawStatus.WITHDRAWAL_SUCCEEDED]: <TxStatus.Success />,
    // Initiate error path
    [BtcWithdrawStatus.WITHDRAWAL_FAILED]: <TxStatus.Failed />,
    [BtcWithdrawStatus.WITHDRAWAL_CHALLENGED]: (
      <TxStatus.Finished
        text={t('transaction-history.withdrawal-challenged')}
      />
    ),
    // Challenge path
    [BtcWithdrawStatus.READY_TO_CHALLENGE]: (
      <TxStatus.InStatus text={t('transaction-history.in-challenge-period')} />
    ),
    [BtcWithdrawStatus.CHALLENGE_IN_PROGRESS]: (
      <TxStatus.InStatus
        text={t('transaction-history.challenge-in-progress')}
      />
    ),
    [BtcWithdrawStatus.CHALLENGE_FAILED]: <TxStatus.Failed />,
  }

  return statuses[withdrawal.status]
}

// This is the component rendering the content of the Status column in the
// transactions history table.
export const WithdrawStatus = ({ withdrawal }: Props) =>
  isToEvmWithdraw(withdrawal) ? (
    <EvmWithdrawStatus withdrawal={withdrawal} />
  ) : (
    <BitcoinWithdrawStatus withdrawal={withdrawal} />
  )
