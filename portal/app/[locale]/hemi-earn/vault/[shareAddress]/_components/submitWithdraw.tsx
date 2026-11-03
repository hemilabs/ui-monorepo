import { Button } from 'components/button'
import { Spinner } from 'components/spinner'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { useTranslations } from 'use-intl'

type Props = {
  canWithdraw: boolean
  isAllowanceError: boolean
  isLoading: boolean
  isRunningOperation: boolean
  needsApproval: boolean
  validationError: string | undefined
}

export const SubmitWithdraw = function ({
  canWithdraw,
  isAllowanceError,
  isLoading,
  isRunningOperation,
  needsApproval,
  validationError,
}: Props) {
  const t = useTranslations()

  const getOperationButtonText = function () {
    if (isLoading) {
      return <Spinner size="small" />
    }
    if (isAllowanceError) {
      return t('common.allowance-load-failed')
    }
    if (validationError) {
      return validationError
    }
    return t(needsApproval ? 'common.approve-and-withdraw' : 'common.withdraw')
  }

  return (
    <SubmitWhenConnected
      submitButton={
        <Button
          disabled={
            !canWithdraw ||
            isRunningOperation ||
            isLoading ||
            isAllowanceError ||
            !!validationError
          }
          size="small"
          type="submit"
        >
          {getOperationButtonText()}
        </Button>
      }
      submitButtonSize="small"
    />
  )
}
