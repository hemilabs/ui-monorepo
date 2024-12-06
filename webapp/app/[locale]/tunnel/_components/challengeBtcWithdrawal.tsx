import { Button } from 'components/button'
import { useChallengeBitcoinWithdrawal } from 'hooks/useBtcTunnel'
import { useTranslations } from 'next-intl'
import { type FormEvent, useContext, useEffect } from 'react'
import { ToBtcWithdrawOperation } from 'types/tunnel'

import { EvmToBtcWithdrawalContext } from '../_context/evmToBtcWithdrawalContext'

import { DrawerCallToAction } from './reviewOperation/drawerCallToAction'

type Props = {
  withdrawal: ToBtcWithdrawOperation
}

export const ChallengeBtcWithdrawal = function ({ withdrawal }: Props) {
  const {
    challengeReceipt,
    challengeError,
    challengeReceiptError,
    challengeWithdrawal,
  } = useChallengeBitcoinWithdrawal(withdrawal)
  const [operationStatus, setOperationStatus] = useContext(
    EvmToBtcWithdrawalContext,
  )

  const t = useTranslations('tunnel-page.submit-button')

  const isChallenging = operationStatus === 'challenging'

  useEffect(
    function clearAfterSuccessfulChallenge() {
      if (challengeReceipt?.status !== 'success' || !isChallenging) {
        return
      }
      setOperationStatus('idle')
    },
    [challengeReceipt, isChallenging, setOperationStatus],
  )

  useEffect(
    function handleUserRejection() {
      if (challengeError && isChallenging) {
        setOperationStatus('rejected')
      }
    },
    [challengeError, isChallenging, setOperationStatus],
  )

  useEffect(
    function handleTransactionFailure() {
      if (challengeReceiptError && isChallenging) {
        setOperationStatus('failed')
      }
    },
    [challengeReceiptError, isChallenging, setOperationStatus],
  )

  const handleChallenge = function (e: FormEvent) {
    e.preventDefault()
    setOperationStatus('challenging')
    challengeWithdrawal()
  }

  const getText = function () {
    if (isChallenging) {
      return 'challenging'
    }
    if (['failed', 'rejected'].includes(operationStatus)) {
      return 'try-again'
    }
    return 'challenge-withdrawal'
  }

  return (
    <DrawerCallToAction
      expectedChainId={withdrawal.l2ChainId}
      onSubmit={handleChallenge}
      submitButton={
        <Button disabled={isChallenging} type="submit">
          {t(getText())}
        </Button>
      }
    />
  )
}
