import { Button } from 'components/button'
import { Spinner } from 'components/spinner'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { useTranslations } from 'use-intl'

type Props = {
  canDeposit: boolean
  isAllowanceError: boolean
  isLoading: boolean
  isRunningOperation: boolean
  needsApproval: boolean
  validationError: string | undefined
}

export const SubmitDeposit = function ({
  canDeposit,
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
    return t(needsApproval ? 'common.approve-and-deposit' : 'common.deposit')
  }

  return (
    <SubmitWhenConnected
      submitButton={
        <Button
          disabled={
            !canDeposit ||
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
