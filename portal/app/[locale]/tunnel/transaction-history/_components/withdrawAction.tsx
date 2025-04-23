import { useNetworkType } from 'hooks/useNetworkType'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import {
  BtcWithdrawStatus,
  MessageStatus,
  type WithdrawTunnelOperation,
} from 'types/tunnel'
import { isToEvmWithdraw } from 'utils/tunnel'

import { CallToAction } from './callToAction'

type Props = {
  withdraw: WithdrawTunnelOperation
}

function EvmWithdrawAction({ withdraw }: Props) {
  const [networkType] = useNetworkType()
  const t = useTranslations('tunnel-page.transaction-history.actions')

  const Failed = (
    <CallToAction
      networkType={networkType}
      text={t('view')}
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

// The action button in a bitcoin withdrawal row is always a "View" that opens
// the drawer with the steps and details, except when the operator fails to
// complete the withdrawal within 12 hours. In that case, the user can challenge
// the operation.
function BitcoinWithdrawAction({ withdraw }: Props) {
  const [networkType] = useNetworkType()
  const t = useTranslations('tunnel-page.transaction-history.actions')

  if (withdraw.status === BtcWithdrawStatus.READY_TO_CHALLENGE) {
    return (
      <CallToAction
        networkType={networkType}
        text={t('challenge')}
        txHash={withdraw.transactionHash}
        variant="primary"
      />
    )
  }

  return (
    <CallToAction
      networkType={networkType}
      text={t('view')}
      txHash={withdraw.transactionHash}
      variant="secondary"
    />
  )
}

// This is the component rendering the content of the Action column in the
// transactions history table. It renders a button that will open the drawer with
// different content depending on the withdrawal parameters.
export const WithdrawAction = ({ withdraw }: Props) =>
  withdraw.status === undefined ? (
    <Skeleton className="w-15 h-8" />
  ) : isToEvmWithdraw(withdraw) ? (
    <EvmWithdrawAction withdraw={withdraw} />
  ) : (
    <BitcoinWithdrawAction withdraw={withdraw} />
  )
