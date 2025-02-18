import { Button } from 'components/button'
import { useToken } from 'hooks/useToken'
import { useTranslations } from 'next-intl'
import { type FormEvent, useContext, useEffect } from 'react'
import Skeleton from 'react-loading-skeleton'
import { EvmToken } from 'token-list'
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
  const { withdraw, withdrawError } = useWithdraw({
    canWithdraw: true,
    fromInput: formatUnits(
      BigInt(withdrawal.amount),
      fromToken.decimals,
    ).toString(),
    fromToken,
    l1ChainId: withdrawal.l1ChainId,
    l2ChainId: withdrawal.l2ChainId,
    toToken,
  })

  const isWithdrawing = operationStatus === 'withdrawing'

  // Success and failure are not needed to be handled here, as a new tx hash is generated, so this component
  // is unmounted and a "new" withdrawal cycle starts
  useEffect(
    function handleUserRejection() {
      if (withdrawError && isWithdrawing) {
        setOperationStatus('rejected')
      }
    },
    [isWithdrawing, setOperationStatus, withdrawError],
  )

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
