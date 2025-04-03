import { useQueryClient } from '@tanstack/react-query'
import { useUmami } from 'app/analyticsEvents'
import { useBalance } from 'btc-wallet/hooks/useBalance'
import { Button } from 'components/button'
import { useChallengeBitcoinWithdrawal } from 'hooks/useBtcTunnel'
import { useNetworkType } from 'hooks/useNetworkType'
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
  const {
    challengeError,
    challengeReceipt,
    challengeReceiptError,
    challengeWithdrawal,
  } = useChallengeBitcoinWithdrawal(withdrawal)
  const [networkType] = useNetworkType()
  const { updateWithdrawal } = useTunnelHistory()
  const [operationStatus, setOperationStatus] =
    useState<OperationStatus>('idle')

  const t = useTranslations('tunnel-page')
  const { track } = useUmami()
  const { queryKey: btcBalanceQueryKey } = useBalance()
  const queryClient = useQueryClient()

  const isChallenging =
    withdrawal.status === BtcWithdrawStatus.CHALLENGE_IN_PROGRESS

  useEffect(
    function handleTxSuccess() {
      if (challengeReceipt?.status === 'success') {
        // This is needed to invalidate the balance query
        // so the balance is updated in the UI instantly
        queryClient.invalidateQueries({ queryKey: btcBalanceQueryKey })

        track?.('btc - challenge success', { chain: networkType })
      }
    },
    [btcBalanceQueryKey, challengeReceipt, networkType, queryClient, track],
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
    function handleTxFailure() {
      if (challengeReceiptError && isChallenging) {
        updateWithdrawal(withdrawal, {
          status: BtcWithdrawStatus.CHALLENGE_FAILED,
        })
        track?.('btc - challenge failed', { chain: networkType })
      }
    },
    [
      challengeReceiptError,
      isChallenging,
      networkType,
      updateWithdrawal,
      track,
      withdrawal,
    ],
  )

  const handleChallenge = function (e: FormEvent) {
    e.preventDefault()
    updateWithdrawal(withdrawal, {
      status: BtcWithdrawStatus.CHALLENGE_IN_PROGRESS,
    })
    challengeWithdrawal()
    track?.('btc - challenge started', { chain: networkType })
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
    <DrawerCallToAction
      expectedChainId={withdrawal.l2ChainId}
      onSubmit={handleChallenge}
      submitButton={
        <Button disabled={isChallenging} type="submit">
          {t(`submit-button.${getText()}`)}
        </Button>
      }
    />
  )
}
