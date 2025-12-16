'use client'

import { Button } from 'components/button'
import { Spinner } from 'components/spinner'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { useTranslations } from 'next-intl'
import { ComponentProps } from 'react'
import { EvmToken } from 'types/token'

import {
  BitcoinYieldDepositStatus,
  type BitcoinYieldDepositOperation,
} from '../_types'

import { Acknowledge } from './acknowledge'

type Props = {
  canDeposit: boolean
  token: EvmToken
  isAllowanceError: boolean
  isAllowanceLoading: boolean
  isRunningOperation: boolean
  needsApproval: boolean
  validationError: string | undefined
  vaultDepositOperation: BitcoinYieldDepositOperation | undefined
} & ComponentProps<typeof Acknowledge>

export const SubmitDeposit = function ({
  acknowledged,
  canDeposit,
  isAllowanceError,
  isAllowanceLoading,
  isRunningOperation,
  needsApproval,
  setAcknowledged,
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
    <div className="flex w-full flex-col gap-y-2 [&>button]:w-full">
      <Acknowledge
        acknowledged={acknowledged}
        setAcknowledged={setAcknowledged}
      />
      <SubmitWhenConnected
        submitButton={
          <Button
            disabled={!canDeposit || isRunningOperation || isAllowanceLoading}
            size="small"
            type="submit"
          >
            {getOperationButtonText()}
          </Button>
        }
        submitButtonSize="small"
      />
    </div>
  )
}
