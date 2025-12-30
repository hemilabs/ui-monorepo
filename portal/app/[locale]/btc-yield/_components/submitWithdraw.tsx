'use client'

import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { useTranslations } from 'next-intl'
import { ComponentProps } from 'react'

import { Acknowledge } from './acknowledge'

type Props = {
  canWithdraw: boolean
  isRunningOperation: boolean
  validationError?: string
} & ComponentProps<typeof Acknowledge>

export const SubmitWithdraw = function ({
  acknowledged,
  canWithdraw,
  isRunningOperation,
  setAcknowledged,
  validationError,
}: Props) {
  const t = useTranslations('common')

  const getOperationButtonText = function () {
    if (validationError) {
      return validationError
    }

    return t('withdraw')
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
            disabled={!canWithdraw || isRunningOperation}
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
