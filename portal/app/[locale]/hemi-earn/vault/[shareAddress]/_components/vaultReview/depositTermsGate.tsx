import { useAccount } from 'wagmi'

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
  const { isError, step, terms } = useTermsStep()

  const isAboutToSign = showsReview({
    canRetry: canRetryDeposit(
      depositOperation?.status ?? DepositStatus.APPROVAL_TX_COMPLETED,
    ),
    hasSigned: depositOperation !== undefined,
  })

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
