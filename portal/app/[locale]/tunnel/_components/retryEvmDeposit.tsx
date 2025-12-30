import { Button } from 'components/button'
import { useToken } from 'hooks/useToken'
import { useTranslations } from 'next-intl'
import { type FormEvent, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { EvmToken } from 'types/token'
import { EvmDepositOperation } from 'types/tunnel'
import { formatUnits } from 'viem'

import { useDeposit } from '../_hooks/useDeposit'

import { DrawerCallToAction } from './reviewOperation/drawerCallToAction'

type EvmDepositOperationStatuses = 'idle' | 'depositing' | 'failed' | 'rejected'

type Props = {
  deposit: EvmDepositOperation
}

const Retry = function ({
  deposit,
  fromToken,
  toToken,
}: Props & {
  fromToken: EvmToken
  toToken: EvmToken
}) {
  const [operationStatus, setOperationStatus] =
    useState<EvmDepositOperationStatuses>('idle')

  const t = useTranslations('common')

  // this component tries to initiate a new deposit, based on the failed one
  const { mutate: runDeposit } = useDeposit({
    fromInput: formatUnits(
      BigInt(deposit.amount),
      fromToken.decimals,
    ).toString(),
    fromToken,
    on(emitter) {
      emitter.on('user-signing-approve-error', () =>
        setOperationStatus('rejected'),
      )
      emitter.on('user-signing-deposit-error', () =>
        setOperationStatus('rejected'),
      )
      emitter.on('approve-transaction-reverted', () =>
        setOperationStatus('failed'),
      )
      emitter.on('deposit-transaction-reverted', () =>
        setOperationStatus('failed'),
      )
      emitter.on('deposit-settled', () => setOperationStatus('idle'))
    },
    toToken,
  })

  const isDepositing = operationStatus === 'depositing'

  const handleRetry = function (e: FormEvent) {
    e.preventDefault()
    setOperationStatus('depositing')
    runDeposit()
  }

  return (
    <DrawerCallToAction
      onSubmit={handleRetry}
      submitButton={
        <Button disabled={isDepositing} size="small">
          {t(isDepositing ? 'depositing' : 'try-again')}
        </Button>
      }
    />
  )
}

export const RetryEvmDeposit = function ({ deposit }: Props) {
  const { data: fromToken } = useToken({
    address: deposit.l1Token,
    chainId: deposit.l1ChainId,
  })

  const { data: toToken } = useToken({
    address: deposit.l2Token,
    chainId: deposit.l2ChainId,
  })

  if (!fromToken || !toToken) {
    return <Skeleton className="h-8 w-full" />
  }

  return (
    <Retry
      deposit={deposit}
      fromToken={fromToken as EvmToken}
      toToken={toToken as EvmToken}
    />
  )
}
