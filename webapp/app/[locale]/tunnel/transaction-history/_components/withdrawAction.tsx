import { MessageStatus } from '@eth-optimism/sdk'
import { useNetworkType } from 'hooks/useNetworkType'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { EvmWithdrawOperation } from 'types/tunnel'
import { getOperationFromWithdraw } from 'utils/tunnel'

import { CallToAction } from './callToAction'

type Props = {
  withdraw: EvmWithdrawOperation
}

export const WithdrawAction = function ({ withdraw }: Props) {
  const [networkType] = useNetworkType()
  const t = useTranslations('tunnel-page.transaction-history.actions')

  if (withdraw.status === undefined) {
    return <Skeleton className="w-15 h-8" />
  }

  const operation = getOperationFromWithdraw(withdraw)

  const Failed = (
    <CallToAction
      networkType={networkType}
      operation={operation}
      text={t('retry')}
      txHash={withdraw.transactionHash}
      variant="secondary"
    />
  )

  const Claim = (
    <CallToAction
      networkType={networkType}
      operation={operation}
      text={t('claim')}
      txHash={withdraw.transactionHash}
      variant="primary"
    />
  )

  const Prove = (
    <CallToAction
      networkType={networkType}
      operation={operation}
      text={t('prove')}
      txHash={withdraw.transactionHash}
      variant="primary"
    />
  )

  const getViewButton = () => (
    <CallToAction
      networkType={networkType}
      operation={operation}
      text={t('view')}
      txHash={withdraw.transactionHash}
      variant="secondary"
    />
  )

  const actions = {
    [MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE]: getViewButton(),
    [MessageStatus.FAILED_L1_TO_L2_MESSAGE]: Failed,
    [MessageStatus.STATE_ROOT_NOT_PUBLISHED]: getViewButton(),
    [MessageStatus.READY_TO_PROVE]: Prove,
    [MessageStatus.IN_CHALLENGE_PERIOD]: getViewButton(),
    [MessageStatus.READY_FOR_RELAY]: Claim,
    [MessageStatus.RELAYED]: getViewButton(),
  }
  return actions[withdraw.status]
}
