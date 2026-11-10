import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAccount } from 'wagmi'

import { hemiEarnTermsKeyPrefix } from '../../../../_fetchers/fetchHemiEarnTerms'
import { hemiEarnTermsAcceptanceKeyPrefix } from '../../../../_fetchers/fetchHemiEarnTermsAcceptance'
import { useTermsStep } from '../../../../_hooks/useTermsStep'
import { useVaultForm } from '../../_context/vaultFormContext'
import { DepositStatus } from '../../_types/operations'
import { canRetryDeposit, showsReview } from '../../_utils/reviewState'

import { AcceptTerms } from './acceptTerms'
import { ReviewDeposit } from './reviewDeposit'

export const DepositTermsGate = function ({
  onClose,
}: {
  onClose: VoidFunction
}) {
  const { address } = useAccount()
  const { depositOperation } = useVaultForm()
  const queryClient = useQueryClient()
  const { isError, step, terms } = useTermsStep()

  const isAboutToSign = showsReview({
    canRetry: canRetryDeposit(
      depositOperation?.status ?? DepositStatus.APPROVAL_TX_COMPLETED,
    ),
    hasSigned: depositOperation !== undefined,
  })

  useEffect(
    function refreshTermsBeforeSigning() {
      if (!isAboutToSign) {
        return
      }
      queryClient.invalidateQueries({ queryKey: hemiEarnTermsKeyPrefix })
      queryClient.invalidateQueries({
        queryKey: hemiEarnTermsAcceptanceKeyPrefix,
      })
    },
    [isAboutToSign, queryClient],
  )

  if (address && isAboutToSign && step !== 'accepted') {
    return (
      <AcceptTerms
        isError={isError}
        onClose={onClose}
        step={step}
        terms={terms}
      />
    )
  }

  return <ReviewDeposit onClose={onClose} />
}
