import { Button } from 'components/button'
import { WarningBox } from 'components/warningBox'
import { useChallengeBitcoinWithdrawal } from 'hooks/useBtcTunnel'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useTranslations } from 'next-intl'
import { type FormEvent, useEffect, useState } from 'react'
import { BtcWithdrawStatus, ToBtcWithdrawOperation } from 'types/tunnel'

import { DrawerCallToAction } from './reviewOperation/drawerCallToAction'

type OperationStatus = 'idle' | 'rejected'

type Props = {
  withdrawal: ToBtcWithdrawOperation
}

export const ChallengeBtcWithdrawal = function ({ withdrawal }: Props) {
  const { challengeError, challengeReceiptError, challengeWithdrawal } =
    useChallengeBitcoinWithdrawal(withdrawal)
  const { updateWithdrawal } = useTunnelHistory()
  const [operationStatus, setOperationStatus] =
    useState<OperationStatus>('idle')

  const t = useTranslations('tunnel-page')

  const isChallenging =
    withdrawal.status === BtcWithdrawStatus.CHALLENGE_IN_PROGRESS

  // No need to handle the success case, as in that case, this component will be unmounted
  // and nothing gets rendered
  useEffect(
    function handleUserRejection() {
      if (challengeError && isChallenging) {
        setOperationStatus('rejected')
      }
    },
    [challengeError, isChallenging, setOperationStatus],
  )

  useEffect(
    function handleTxFailure() {
      if (challengeReceiptError && isChallenging) {
        updateWithdrawal(withdrawal, {
          status: BtcWithdrawStatus.CHALLENGE_FAILED,
        })
      }
    },
    [challengeReceiptError, isChallenging, updateWithdrawal, withdrawal],
  )

  const handleChallenge = function (e: FormEvent) {
    e.preventDefault()
    updateWithdrawal(withdrawal, {
      status: BtcWithdrawStatus.CHALLENGE_IN_PROGRESS,
    })
    challengeWithdrawal()
  }

  const getText = function () {
    if (isChallenging) {
      return 'challenging'
    }
    if (
      operationStatus === 'rejected' ||
      withdrawal.status === BtcWithdrawStatus.CHALLENGE_FAILED
    ) {
      return 'try-again'
    }
    return 'challenge-withdrawal'
  }

  return (
    <div className="flex h-full flex-col justify-between gap-y-24">
      <WarningBox
        heading={t('review-withdrawal.we-could-not-process-this-withdraw')}
        subheading={t('review-withdrawal.challenge-to-get-bitcoins-back')}
      />
      <DrawerCallToAction
        expectedChainId={withdrawal.l2ChainId}
        onSubmit={handleChallenge}
        submitButton={
          <Button disabled={isChallenging} type="submit">
            {t(`submit-button.${getText()}`)}
          </Button>
        }
      />
    </div>
  )
}
