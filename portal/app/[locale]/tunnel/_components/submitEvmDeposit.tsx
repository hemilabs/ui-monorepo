'use client'

import { Button } from 'components/button'
import { Spinner } from 'components/spinner'
import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
import { useTranslations } from 'next-intl'
import { EvmToken } from 'types/token'
import { tunnelsThroughPartners } from 'utils/token'

type Props = {
  canDeposit: boolean
  fromToken: EvmToken
  isAllowanceError: boolean
  isAllowanceLoading: boolean
  isRunningOperation: boolean
  needsApproval: boolean
  operationRunning: 'idle' | 'approving' | 'depositing'
  setIsPartnersDrawerOpen: (isOpen: boolean) => void
  validationError: string | undefined
}
export const SubmitEvmDeposit = function ({
  canDeposit,
  fromToken,
  isAllowanceError,
  isAllowanceLoading,
  isRunningOperation,
  needsApproval,
  operationRunning,
  setIsPartnersDrawerOpen,
  validationError,
}: Props) {
  const t = useTranslations()

  if (tunnelsThroughPartners(fromToken)) {
    return (
      <Button
        onClick={() => setIsPartnersDrawerOpen(true)}
        size="xLarge"
        type="button"
      >
        {t('tunnel-page.tunnel-partners.tunnel-with-our-partners')}
      </Button>
    )
  }

  const getOperationButtonText = function () {
    const texts = {
      approve: {
        error: t('tunnel-page.submit-button.allowance-load-failed'),
        idle: t('common.approve-and-deposit'),
        loading: t('common.approving'),
      },
      deposit: {
        idle: t('common.deposit'),
        loading: t('common.depositing'),
      },
    }
    if (isAllowanceLoading) {
      return <Spinner size={'small'} />
    }
    if (isAllowanceError) {
      return texts.approve.error
    }
    if (operationRunning === 'approving') {
      return texts.approve.loading
    }
    if (operationRunning === 'depositing') {
      return texts.deposit.loading
    }
    if (validationError) {
      return validationError
    }
    return texts[needsApproval ? 'approve' : 'deposit'].idle
  }

  return (
    <SubmitWhenConnectedToChain
      chainId={fromToken.chainId}
      submitButton={
        <Button
          disabled={!canDeposit || isRunningOperation || isAllowanceLoading}
          size="xLarge"
          type="submit"
        >
          {getOperationButtonText()}
        </Button>
      }
    />
  )
}
