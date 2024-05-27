import { MessageDirection, MessageStatus } from '@eth-optimism/sdk'
import { WithdrawOperation } from 'context/tunnelHistoryContext/types'
import { useAnyChainGetTransactionMessageStatus } from 'hooks/useL2Bridge'
import { useTranslations } from 'next-intl'
import Link from 'next-intl/link'
import Skeleton from 'react-loading-skeleton'
import { type Chain } from 'viem'

const Action = ({
  className = 'bg-orange-950 text-white',
  txHash,
  operation,
  text,
}: {
  className?: string
  txHash: string
  operation: string
  text: string
}) => (
  <Link
    className={`inline-block rounded-3xl px-5 py-3 text-xs ${className}`}
    href={`/tunnel?txHash=${txHash}&operation=${operation}`}
  >
    {text}
  </Link>
)

type Props = {
  l1ChainId: Chain['id']
  withdraw: WithdrawOperation
}

export const WithdrawAction = function ({ l1ChainId, withdraw }: Props) {
  const { isLoadingMessageStatus, messageStatus } =
    useAnyChainGetTransactionMessageStatus({
      direction: MessageDirection.L2_TO_L1,
      l1ChainId,
      placeholderData: withdraw.status,
      // @ts-expect-error string is Hash `0x${string}`
      transactionHash: withdraw.transactionHash,
    })

  const t = useTranslations('tunnel-page.transaction-history.actions')

  if (isLoadingMessageStatus) {
    return <Skeleton className="h-9 w-24" />
  }

  const Failed = (
    <Action
      operation="withdraw"
      text={t('retry')}
      txHash={withdraw.transactionHash}
    />
  )

  const Claim = (
    <Action
      operation="claim"
      text={t('claim')}
      txHash={withdraw.transactionHash}
    />
  )

  const Prove = (
    <Action
      operation="prove"
      text={t('prove')}
      txHash={withdraw.transactionHash}
    />
  )

  const getViewButton = (operation: string) => (
    <Action
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
    [MessageStatus.IN_CHALLENGE_PERIOD]: Claim,
    [MessageStatus.READY_FOR_RELAY]: Claim,
    [MessageStatus.RELAYED]: getViewButton('view'),
  }
  return actions[messageStatus]
}
