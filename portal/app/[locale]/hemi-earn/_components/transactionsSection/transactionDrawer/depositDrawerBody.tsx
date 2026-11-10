import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { hemiEarnTermsKeyPrefix } from '../../../_fetchers/fetchHemiEarnTerms'
import { hemiEarnTermsAcceptanceKeyPrefix } from '../../../_fetchers/fetchHemiEarnTermsAcceptance'
import { useTermsStep } from '../../../_hooks/useTermsStep'
import {
  type TermsStep,
  isStartingRetry,
  showsTermsStep,
} from '../../../_utils/termsGate'
import {
  canRetryRow,
  isRemoteFailed,
  needsManualClaim,
  needsRecover,
} from '../../../_utils/transactionPredicates'
import {
  type EarnAsset,
  type EarnTransaction,
  type EarnVault,
} from '../../../types'
import { AcceptTerms } from '../../../vault/[shareAddress]/_components/vaultReview/acceptTerms'
import { useIsDepositing } from '../../../vault/[shareAddress]/_hooks/useDeposit'

import { HistoricalDepositReview } from './historicalDepositReview'
import { RemoteFailedCta } from './remoteFailed'
import { RetryFailedDeposit } from './retryFailedDeposit'
import { AddTokenToWalletCta, SettleCta } from './settleShared'

function depositCallToAction({
  asset,
  onTermsRequired,
  termsStep,
  transaction,
  vault,
}: {
  asset: EarnAsset
  onTermsRequired: VoidFunction
  termsStep: TermsStep | undefined
  transaction: EarnTransaction
  vault: EarnVault
}) {
  if (canRetryRow(transaction)) {
    return (
      <RetryFailedDeposit
        asset={asset}
        onTermsRequired={onTermsRequired}
        termsStep={termsStep}
        transaction={transaction}
        vault={vault}
      />
    )
  }
  if (isRemoteFailed(transaction)) {
    return <RemoteFailedCta transaction={transaction} />
  }
  if (needsManualClaim(transaction)) {
    return (
      <SettleCta
        asset={asset}
        operation="CLAIM"
        transaction={transaction}
        vault={vault}
      />
    )
  }
  if (needsRecover(transaction)) {
    return (
      <SettleCta
        asset={asset}
        operation="RECOVER"
        transaction={transaction}
        vault={vault}
      />
    )
  }
  if (transaction.status === 'FINALIZED') {
    return <AddTokenToWalletCta token={vault.shareToken} />
  }
  return null
}

type Props = {
  asset: EarnAsset
  onClose: VoidFunction
  transaction: EarnTransaction
  vault: EarnVault
}

export const DepositDrawerBody = function ({
  asset,
  onClose,
  transaction,
  vault,
}: Props) {
  const [askedForTerms, setAskedForTerms] = useState(false)
  const queryClient = useQueryClient()
  const isDepositing = useIsDepositing(vault.shareAddress)
  const { isError, step, terms } = useTermsStep()

  const canRetry = canRetryRow(transaction)

  useEffect(
    function refreshTermsBeforeSigning() {
      if (!canRetry) {
        return
      }
      queryClient.invalidateQueries({ queryKey: hemiEarnTermsKeyPrefix })
      queryClient.invalidateQueries({
        queryKey: hemiEarnTermsAcceptanceKeyPrefix,
      })
    },
    [canRetry, queryClient],
  )

  const isStartingDeposit = isStartingRetry({
    canRetry,
    hasAskedForTerms: askedForTerms,
    isTermsError: isError,
  })

  if (!isDepositing && showsTermsStep({ isStartingDeposit, step })) {
    return (
      <AcceptTerms
        isError={isError}
        onClose={onClose}
        step={step}
        terms={terms}
      />
    )
  }

  return (
    <HistoricalDepositReview
      callToAction={depositCallToAction({
        asset,
        onTermsRequired: () => setAskedForTerms(true),
        termsStep: step,
        transaction,
        vault,
      })}
      onClose={onClose}
      token={asset.token}
      transaction={transaction}
      vault={vault}
    />
  )
}
