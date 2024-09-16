import { MessageStatus } from '@eth-optimism/sdk'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { EvmWithdrawOperation } from 'types/tunnel'

import { CallToAction } from './callToAction'

type Props = {
  withdraw: EvmWithdrawOperation
}

export const WithdrawAction = function ({ withdraw }: Props) {
  const t = useTranslations('tunnel-page.transaction-history.actions')

  if (withdraw.status === undefined) {
    return <Skeleton className="w-15 h-8" />
  }

  const Failed = (
    <CallToAction
      operation="withdraw"
      text={t('retry')}
      txHash={withdraw.transactionHash}
      variant="secondary"
    />
  )

  const Claim = (
    <CallToAction
      operation="claim"
      text={t('claim')}
      txHash={withdraw.transactionHash}
      variant="primary"
    />
  )

  const Prove = (
    <CallToAction
      operation="prove"
      text={t('prove')}
      txHash={withdraw.transactionHash}
      variant="primary"
    />
  )

  const getViewButton = (operation: string) => (
    <CallToAction
      operation={operation}
      text={t('view')}
      txHash={withdraw.transactionHash}
      variant="secondary"
    />
  )

  const actions = {
    [MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE]: getViewButton('withdraw'),
    [MessageStatus.FAILED_L1_TO_L2_MESSAGE]: Failed,
    [MessageStatus.STATE_ROOT_NOT_PUBLISHED]: getViewButton('prove'),
    [MessageStatus.READY_TO_PROVE]: Prove,
    [MessageStatus.IN_CHALLENGE_PERIOD]: getViewButton('claim'),
    [MessageStatus.READY_FOR_RELAY]: Claim,
    [MessageStatus.RELAYED]: getViewButton('view'),
  }
  return actions[withdraw.status]
}
