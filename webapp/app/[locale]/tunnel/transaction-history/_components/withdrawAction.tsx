import { MessageStatus } from '@eth-optimism/sdk'
import { useNetworkType } from 'hooks/useNetworkType'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { type WithdrawTunnelOperation } from 'types/tunnel'
import { isToEvmWithdraw } from 'utils/tunnel'

import { CallToAction } from './callToAction'

type Props = {
  withdraw: WithdrawTunnelOperation
}

export const WithdrawAction = function ({ withdraw }: Props) {
  const [networkType] = useNetworkType()
  const t = useTranslations('tunnel-page.transaction-history.actions')

  if (!isToEvmWithdraw(withdraw)) {
    // Bitcoin withdrawals do not have a view option, just like EVM deposits
    // this will change in the design, though.
    return null
  }

  if (withdraw.status === undefined) {
    return <Skeleton className="w-15 h-8" />
  }

  const Failed = (
    <CallToAction
      networkType={networkType}
      text={t('retry')}
      txHash={withdraw.transactionHash}
      variant="secondary"
    />
  )

  const Claim = (
    <CallToAction
      networkType={networkType}
      text={t('claim')}
      txHash={withdraw.transactionHash}
      variant="primary"
    />
  )

  const Prove = (
    <CallToAction
      networkType={networkType}
      text={t('prove')}
      txHash={withdraw.transactionHash}
      variant="primary"
    />
  )

  const getViewButton = () => (
    <CallToAction
      networkType={networkType}
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
