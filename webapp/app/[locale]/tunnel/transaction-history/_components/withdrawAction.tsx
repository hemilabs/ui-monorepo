import { MessageStatus } from '@eth-optimism/sdk'
import { EvmWithdrawOperation } from 'context/tunnelHistoryContext/types'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'

import { CallToAction } from './callToAction'

type Props = {
  withdraw: EvmWithdrawOperation
}

export const WithdrawAction = function ({ withdraw }: Props) {
  const t = useTranslations('tunnel-page.transaction-history.actions')

  if (withdraw.status === undefined) {
    return <Skeleton className="h-9 w-24" />
  }

  const Failed = (
    <CallToAction
      operation="withdraw"
      text={t('retry')}
      txHash={withdraw.transactionHash}
    />
  )

  const Claim = (
    <CallToAction
      operation="claim"
      text={t('claim')}
      txHash={withdraw.transactionHash}
    />
  )

  const Prove = (
    <CallToAction
      operation="prove"
      text={t('prove')}
      txHash={withdraw.transactionHash}
    />
  )

  const getViewButton = (operation: string) => (
    <CallToAction
      className="border border-solid border-slate-50 bg-slate-100 text-slate-950"
      operation={operation}
      text={t('view')}
      txHash={withdraw.transactionHash}
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
