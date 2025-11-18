'use client'

import { Button, ButtonSize } from 'components/button'
import { Spinner } from 'components/spinner'
import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
import { useTranslations } from 'next-intl'
import { EvmToken } from 'types/token'

import {
  BitcoinYieldDepositStatus,
  type BitcoinYieldDepositOperation,
} from '../_types'

type Props = {
  buttonSize?: ButtonSize
  canDeposit: boolean
  token: EvmToken
  isAllowanceError: boolean
  isAllowanceLoading: boolean
  isRunningOperation: boolean
  needsApproval: boolean
  validationError: string | undefined
  vaultDepositOperation: BitcoinYieldDepositOperation | undefined
}
export const SubmitDeposit = function ({
  buttonSize = 'xLarge',
  canDeposit,
  isAllowanceError,
  isAllowanceLoading,
  isRunningOperation,
  needsApproval,
  token,
  validationError,
  vaultDepositOperation,
}: Props) {
  const t = useTranslations('common')

  const getOperationButtonText = function () {
    const texts = {
      approve: {
        error: t('allowance-load-failed'),
        idle: t('approve-and-deposit'),
        loading: t('approving'),
      },
      deposit: {
        idle: t('deposit'),
        loading: t('depositing'),
      },
    }
    if (isAllowanceLoading) {
      return <Spinner size="small" />
    }
    if (isAllowanceError) {
      return texts.approve.error
    }
    if (
      vaultDepositOperation?.status ===
      BitcoinYieldDepositStatus.APPROVAL_TX_PENDING
    ) {
      return texts.approve.loading
    }
    if (
      vaultDepositOperation?.status ===
      BitcoinYieldDepositStatus.APPROVAL_TX_COMPLETED
    ) {
      return texts.deposit.loading
    }
    if (validationError) {
      return validationError
    }
    return texts[needsApproval ? 'approve' : 'deposit'].idle
  }

  return (
    <div className="w-full [&>button]:w-full">
      <SubmitWhenConnectedToChain
        chainId={token.chainId}
        submitButton={
          <Button
            disabled={!canDeposit || isRunningOperation || isAllowanceLoading}
            size={buttonSize}
            type="submit"
          >
            {getOperationButtonText()}
          </Button>
        }
        submitButtonSize={buttonSize}
      />
    </div>
  )
}
