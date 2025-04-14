import { Button } from 'components/button'
import { useToken } from 'hooks/useToken'
import { useTranslations } from 'next-intl'
import { type FormEvent, useContext } from 'react'
import Skeleton from 'react-loading-skeleton'
import { EvmToken } from 'types/token'
import { ToEvmWithdrawOperation } from 'types/tunnel'
import { formatUnits } from 'viem'

import { ToEvmWithdrawalContext } from '../_context/toEvmWithdrawalContext'
import { useWithdraw } from '../_hooks/useWithdraw'

import { DrawerCallToAction } from './reviewOperation/drawerCallToAction'

type Props = {
  withdrawal: ToEvmWithdrawOperation
}

const Retry = function ({
  fromToken,
  toToken,
  withdrawal,
}: Props & {
  fromToken: EvmToken
  toToken: EvmToken
}) {
  const [operationStatus, setOperationStatus] = useContext(
    ToEvmWithdrawalContext,
  )

  const t = useTranslations('tunnel-page.submit-button')

  // this component tries to initiate a new withdrawal, based on the failed one
  const { mutate: withdraw } = useWithdraw({
    fromInput: formatUnits(
      BigInt(withdrawal.amount),
      fromToken.decimals,
    ).toString(),
    fromToken,
    on(emitter) {
      emitter.on('user-signing-withdraw-error', () =>
        setOperationStatus('rejected'),
      )
      emitter.on('withdraw-transaction-reverted', () =>
        setOperationStatus('failed'),
      )
    },
    toToken,
  })

  const isWithdrawing = operationStatus === 'withdrawing'

  const handleRetry = function (e: FormEvent) {
    e.preventDefault()
    setOperationStatus('withdrawing')
    withdraw()
  }

  return (
    <DrawerCallToAction
      expectedChainId={withdrawal.l2ChainId}
      onSubmit={handleRetry}
      submitButton={
        <Button disabled={isWithdrawing}>
          {t(isWithdrawing ? 'withdrawing' : 'try-again')}
        </Button>
      }
    />
  )
}

export const RetryEvmWithdrawal = function ({ withdrawal }: Props) {
  const { data: toToken } = useToken({
    address: withdrawal.l1Token,
    chainId: withdrawal.l1ChainId,
  })

  const { data: fromToken } = useToken({
    address: withdrawal.l2Token,
    chainId: withdrawal.l2ChainId,
  })

  if (!fromToken || !toToken) {
    return <Skeleton className="h-8 w-full" />
  }

  return (
    <Retry
      fromToken={fromToken as EvmToken}
      toToken={toToken as EvmToken}
      withdrawal={withdrawal}
    />
  )
}
