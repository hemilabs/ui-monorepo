import { Button } from 'components/button'
import { useTranslations } from 'next-intl'
import { type FormEvent, useContext, useEffect } from 'react'
import { EvmToken } from 'types/token'
import { EvmDepositOperation } from 'types/tunnel'
import { getNativeToken, getTokenByAddress, isNativeToken } from 'utils/token'
import { formatUnits } from 'viem'

import { EvmDepositContext } from '../_context/evmDepositContext'
import { useDeposit } from '../_hooks/useDeposit'

import { DrawerCallToAction } from './reviewOperation/drawerCallToAction'

type Props = {
  deposit: EvmDepositOperation
}

export const RetryEvmDeposit = function ({ deposit }: Props) {
  const [operationStatus, setOperationStatus] = useContext(EvmDepositContext)

  const t = useTranslations('tunnel-page.submit-button')

  const fromToken = getTokenByAddress(
    deposit.l1Token,
    deposit.l1ChainId,
  ) as EvmToken

  // L2 native tunneled token is on a special address, so it is easier to get the native token
  const toToken = (
    isNativeToken(fromToken)
      ? getNativeToken(deposit.l2ChainId)
      : getTokenByAddress(deposit.l2Token, deposit.l2ChainId)
  ) as EvmToken

  // this component tries to initiate a new deposit, based on the failed one
  const { deposit: runDeposit, depositError } = useDeposit({
    canDeposit: true,
    extendedErc20Approval: false,
    fromInput: formatUnits(
      BigInt(deposit.amount),
      fromToken.decimals,
    ).toString(),
    fromToken,
    toToken,
  })

  useEffect(
    // on unmounting the component, reset the context
    () => () => setOperationStatus('idle'),
    [setOperationStatus],
  )

  const isDepositing = operationStatus === 'depositing'

  // Success and failure are not needed to be handled here, as a new tx hash is generated, so this component
  // is unmounted and a "new" withdrawal cycle starts
  useEffect(
    function handleUserRejection() {
      if (depositError && isDepositing) {
        setOperationStatus('rejected')
      }
    },
    [depositError, isDepositing, setOperationStatus],
  )

  const handleRetry = function (e: FormEvent) {
    e.preventDefault()
    setOperationStatus('depositing')
    runDeposit()
  }

  return (
    <DrawerCallToAction
      expectedChainId={deposit.l1ChainId}
      onSubmit={handleRetry}
      submitButton={
        <Button disabled={isDepositing}>
          {t(isDepositing ? 'depositing' : 'try-again')}
        </Button>
      }
    />
  )
}
