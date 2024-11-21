import { Button } from 'components/button'
import { useToken } from 'hooks/useToken'
import { useTranslations } from 'next-intl'
import { type FormEvent, useContext, useEffect } from 'react'
import Skeleton from 'react-loading-skeleton'
import { EvmToken } from 'types/token'
import { EvmDepositOperation } from 'types/tunnel'
import { formatUnits } from 'viem'

import { EvmDepositContext } from '../_context/evmDepositContext'
import { useDeposit } from '../_hooks/useDeposit'

import { DrawerCallToAction } from './reviewOperation/drawerCallToAction'

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
  const [operationStatus, setOperationStatus] = useContext(EvmDepositContext)

  const t = useTranslations('tunnel-page.submit-button')

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

  const isDepositing = operationStatus === 'depositing'

  useEffect(
    // on unmounting the component, reset the context
    () => () => setOperationStatus('idle'),
    [setOperationStatus],
  )

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
