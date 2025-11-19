'use client'

import { Button } from 'components/button'
import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
import { useTranslations } from 'next-intl'
import type { EvmToken } from 'types/token'

type Props = {
  canWithdraw: boolean
  isRunningOperation: boolean
  token: EvmToken
  validationError?: string
}

export const SubmitWithdraw = function ({
  canWithdraw,
  isRunningOperation,
  token,
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
      <SubmitWhenConnectedToChain
        chainId={token.chainId}
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
