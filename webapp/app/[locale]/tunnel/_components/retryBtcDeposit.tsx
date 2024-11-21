import { Button } from 'components/button'
import { useDepositBitcoin } from 'hooks/useBtcTunnel'
import { useTranslations } from 'next-intl'
import { type FormEvent, useContext, useEffect } from 'react'
import { BtcDepositOperation } from 'types/tunnel'
import { useAccount } from 'wagmi'

import { BtcToEvmDepositContext } from '../_context/btcToEvmContext'

import { DrawerCallToAction } from './reviewOperation/drawerCallToAction'

type Props = {
  deposit: BtcDepositOperation
}

export const RetryBtcDeposit = function ({ deposit }: Props) {
  const { address } = useAccount()
  const { depositBitcoin, depositError } = useDepositBitcoin()
  const [operationStatus, setOperationStatus] = useContext(
    BtcToEvmDepositContext,
  )
  const t = useTranslations('tunnel-page.submit-button')

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
    depositBitcoin({
      hemiAddress: address,
      l1ChainId: deposit.l1ChainId,
      l2ChainId: deposit.l2ChainId,
      satoshis: Number(deposit.amount),
    })
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
