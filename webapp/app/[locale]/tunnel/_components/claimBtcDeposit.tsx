import { Button } from 'components/button'
import { WarningIcon } from 'components/icons/warningIcon'
import { useClaimBitcoinDeposit } from 'hooks/useBtcTunnel'
import { useTranslations } from 'next-intl'
import { type FormEvent, useContext, useEffect } from 'react'
import { type BtcDepositOperation, BtcDepositStatus } from 'types/tunnel'

import { BtcToEvmDepositContext } from '../_context/btcToEvmContext'

import { DrawerCallToAction } from './reviewOperation/drawerCallToAction'

type Props = {
  deposit: BtcDepositOperation
}

export const ClaimBtcDeposit = function ({ deposit }: Props) {
  const {
    claimBitcoinDeposit,
    claimBitcoinDepositReceipt,
    claimBitcoinDepositError,
    claimBitcoinDepositReceiptError,
  } = useClaimBitcoinDeposit(deposit)
  const [operationStatus, setOperationStatus] = useContext(
    BtcToEvmDepositContext,
  )
  const t = useTranslations()

  const isClaiming = operationStatus === 'claiming'

  useEffect(
    function clearAfterSuccessfulClaim() {
      if (
        claimBitcoinDepositReceipt?.status !== 'success' ||
        operationStatus !== 'claiming'
      ) {
        return
      }
      setOperationStatus('idle')
    },
    [claimBitcoinDepositReceipt, operationStatus, setOperationStatus],
  )

  useEffect(
    function handleUserRejection() {
      if (claimBitcoinDepositError && isClaiming) {
        setOperationStatus('rejected')
      }
    },
    [claimBitcoinDepositError, isClaiming, setOperationStatus],
  )

  useEffect(
    function handleTransactionFailure() {
      if (claimBitcoinDepositReceiptError && isClaiming) {
        setOperationStatus('failed')
      }
    },
    [claimBitcoinDepositReceiptError, isClaiming, setOperationStatus],
  )

  const isReadyToClaim = deposit.status === BtcDepositStatus.BTC_READY_CLAIM

  const handleClaim = function (e: FormEvent) {
    e.preventDefault()
    if (!isReadyToClaim) {
      return
    }
    claimBitcoinDeposit()
    setOperationStatus('claiming')
  }

  const getText = function () {
    if (isClaiming) {
      return 'claiming-deposit'
    }
    if (['failed', 'rejected'].includes(operationStatus)) {
      return 'try-again'
    }
    return 'claim-deposit'
  }

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex flex-col gap-y-1 rounded-lg bg-neutral-50 p-4 text-sm font-medium">
        <div className="flex items-center gap-x-1">
          <WarningIcon />
          <p className="text-neutral-900">
            {t('tunnel-page.review-deposit.we-could-not-process-this-deposit')}
          </p>
        </div>
        <p className="text-neutral-500">
          {t('tunnel-page.review-deposit.click-to-claim')}
        </p>
      </div>
      <DrawerCallToAction
        expectedChainId={deposit.l2ChainId}
        onSubmit={handleClaim}
        submitButton={
          <Button disabled={!isReadyToClaim || isClaiming} type="submit">
            {t(`tunnel-page.submit-button.${getText()}`)}
          </Button>
        }
      />
    </div>
  )
}
