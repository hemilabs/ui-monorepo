'use client'

import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { useTranslations } from 'next-intl'

type Props = {
  canWithdraw: boolean
  isRunningOperation: boolean
  validationError?: string
}

export const SubmitWithdraw = function ({
  canWithdraw,
  isRunningOperation,
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
    <div className="w-full [&>button]:w-full">
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
