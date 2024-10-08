import { Button } from 'components/button'
import { useTranslations } from 'next-intl'
import { type FormEvent, useContext, useEffect } from 'react'
import { EvmToken } from 'types/token'
import { ToEvmWithdrawOperation } from 'types/tunnel'
import { getNativeToken, getTokenByAddress, isNativeToken } from 'utils/token'
import { formatUnits } from 'viem'

import { ToEvmWithdrawalContext } from '../_context/toEvmWithdrawalContext'
import { useWithdraw } from '../_hooks/useWithdraw'

import { DrawerCallToAction } from './reviewOperation/drawerCallToAction'

type Props = {
  withdrawal: ToEvmWithdrawOperation
}

export const RetryEvmWithdrawal = function ({ withdrawal }: Props) {
  const [operationStatus, setOperationStatus] = useContext(
    ToEvmWithdrawalContext,
  )

  const t = useTranslations('tunnel-page.submit-button')

  const toToken = getTokenByAddress(
    withdrawal.l1Token,
    withdrawal.l1ChainId,
  ) as EvmToken

  // L2 native tunneled token is on a special address, so it is easier to get the native token
  const fromToken = (
    isNativeToken(toToken)
      ? getNativeToken(withdrawal.l2ChainId)
      : getTokenByAddress(withdrawal.l2Token, withdrawal.l2ChainId)
  ) as EvmToken

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
