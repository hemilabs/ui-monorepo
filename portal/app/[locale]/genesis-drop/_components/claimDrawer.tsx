import { MutationStatus } from '@tanstack/react-query'
import { Button } from 'components/button'
import { Drawer } from 'components/drawer'
import { Operation } from 'components/reviewOperation/operation'
import { ProgressStatus } from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
import { useHemi } from 'hooks/useHemi'
import { useTranslations } from 'next-intl'
import { FormEvent } from 'react'
import { LockupMonths, type EligibilityData } from 'tge-claim'
import { getNativeToken } from 'utils/nativeToken'
import { formatUnits, Hash } from 'viem'

import { useEstimateClaimFees } from '../_hooks/useEstimateClaimFees'
import { useHemiToken } from '../_hooks/useHemiToken'

type Props = {
  eligibility: EligibilityData
  isRetrying: boolean
  lockupMonths: LockupMonths
  onClose: VoidFunction
  onRetry: VoidFunction
  ratio: number
  status: MutationStatus
  termsSignature: Hash
  transactionHash: Hash | undefined
}

export const ClaimDrawer = function ({
  eligibility,
  isRetrying,
  lockupMonths,
  onClose,
  onRetry,
  ratio,
  status,
  termsSignature,
  transactionHash,
}: Props) {
  const hemi = useHemi()
  const hemiToken = useHemiToken()
  const tCommon = useTranslations('common')
  const t = useTranslations('genesis-drop')

  const {
    fees: claimGasFees = BigInt(0),
    isError: isClaimGasFeesError = false,
  } = useEstimateClaimFees({
    eligibility,
    lockupMonths,
    ratio,
    termsSignature,
  })

  const handleRetry = function (e: FormEvent) {
    e.preventDefault()
    onRetry()
  }

  const getCallToAction = () =>
    status === 'error' ? (
      <form className="flex w-full [&>button]:w-full" onSubmit={handleRetry}>
        <SubmitWhenConnectedToChain
          chainId={hemi.id}
          submitButton={
            <Button disabled={isRetrying} size="small" variant="primary">
              {tCommon('try-again')}
            </Button>
          }
          submitButtonSize="small"
        />
      </form>
    ) : null

  const statusMap: Partial<Record<MutationStatus, ProgressStatus>> = {
    error: ProgressStatus.FAILED,
    pending: ProgressStatus.PROGRESS,
    success: ProgressStatus.COMPLETED,
  }

  const steps: StepPropsWithoutPosition[] = [
    {
      description: t('claiming-your-rewards'),
      explorerChainId: hemi.id,
      fees: claimGasFees
        ? {
            amount: formatUnits(claimGasFees, hemi.nativeCurrency.decimals),
            isError: isClaimGasFeesError,
            token: getNativeToken(hemi.id),
          }
        : undefined,
      status: statusMap[status] || ProgressStatus.NOT_READY,
      txHash: transactionHash,
    },
  ]

  return (
    <Drawer onClose={onClose}>
      <div className="drawer-content h-[80dvh] md:h-full">
        <Operation
          amount={eligibility.amount.toString()}
          callToAction={getCallToAction()}
          heading={t('claim-rewards')}
          onClose={onClose}
          steps={steps}
          subheading={t('claiming-your-rewards')}
          token={hemiToken}
        />
      </div>
    </Drawer>
  )
}
