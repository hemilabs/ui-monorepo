import {
  ReviewWithdraw,
  WithdrawProgress,
} from 'components/reviewBox/reviewWithdraw'
import { useTranslations } from 'next-intl'
import { ReactNode, useEffect, useState } from 'react'
import { Button } from 'ui-common/components/button'
import { formatNumber } from 'utils/format'
import { formatUnits, type Hash } from 'viem'
import { useConfig } from 'wagmi'

import { useBridgeState } from '../_hooks/useBridgeState'

import { BridgeForm } from './form'

const SubmitButton = function ({
  isClaiming,
  isReadyToClaim,
}: {
  isClaiming: boolean
  isReadyToClaim: boolean
}) {
  const t = useTranslations()
  return (
    <Button disabled={!isReadyToClaim || isClaiming} type="submit">
      {t(
        `bridge-page.submit-button.${
          isClaiming ? 'claiming-withdrawal' : 'claim-withdrawal'
        }`,
      )}
    </Button>
  )
}

const useTransactionList = function ({
  proveWithdrawalTxHash,
  showProveWithdrawalTx,
}: {
  proveWithdrawalTxHash: Hash
  showProveWithdrawalTx: boolean
}) {
  const t = useTranslations()
  const transactionsList = []

  if (showProveWithdrawalTx) {
    transactionsList.push({
      id: 'prove',
      status: 'success',
      text: t('bridge-page.transaction-status.withdrawal-proved'),
      txHash: proveWithdrawalTxHash,
    })
    return transactionsList
  }

  return transactionsList
}

type Props = {
  renderForm: (isRunningOperation: boolean) => ReactNode
  state: ReturnType<typeof useBridgeState> & { operation: 'claim' }
}

export const Claim = function ({ renderForm, state }: Props) {
  // initially show the Withdraw Tx hash, because this component renders as soon as it is
  // confirmed, so after some time, we must hide it!
  const [showProveWithdrawalTx, setShowProveWithdrawalTx] = useState(true)
  const [withdrawProgress] = useState<WithdrawProgress>(
    WithdrawProgress.WAITING_FOR_CLAIM_ENABLED,
  )

  const { chains = [] } = useConfig()

  const {
    proveWithdrawalTxHash,
    withdrawAmount,
    withdrawL1NetworkId,
    withdrawSymbol,
    withdrawTxHash,
  } = state

  const fromChain = chains.find(c => c.id === withdrawL1NetworkId)

  useEffect(
    function hideProveTxFromTransactionList() {
      const timeoutId = setTimeout(function () {
        if (showProveWithdrawalTx) {
          setShowProveWithdrawalTx(false)
        }
      }, 7000)
      return () => clearTimeout(timeoutId)
    },
    [setShowProveWithdrawalTx, showProveWithdrawalTx],
  )

  const handleClaim = function () {
    // TODO https://github.com/BVM-priv/ui-monorepo/issues/113
  }

  const isClaiming = withdrawProgress === WithdrawProgress.CLAIMING

  const transactionsList = useTransactionList({
    proveWithdrawalTxHash,
    showProveWithdrawalTx,
  })

  return (
    <BridgeForm
      formContent={renderForm(isClaiming)}
      onSubmit={handleClaim}
      reviewOperation={
        <ReviewWithdraw
          // TODO get real gas fees https://github.com/BVM-priv/ui-monorepo/issues/113
          gas={formatUnits(BigInt(0), fromChain?.nativeCurrency.decimals)}
          gasSymbol={fromChain?.nativeCurrency.symbol}
          operation="claim"
          progress={withdrawProgress}
          proveWithdrawalTxHash={proveWithdrawalTxHash}
          toWithdraw={formatNumber(withdrawAmount, 3)}
          withdrawSymbol={withdrawSymbol}
          withdrawTxHash={withdrawTxHash}
        />
      }
      submitButton={
        <SubmitButton
          isClaiming={isClaiming}
          // TODO https://github.com/BVM-priv/ui-monorepo/issues/113
          isReadyToClaim={false}
        />
      }
      transactionsList={transactionsList}
    />
  )
}
