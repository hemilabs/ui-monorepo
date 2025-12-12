'use client'

import { Button } from 'components/button'
import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
import { useTranslations } from 'next-intl'
import { ComponentProps } from 'react'
import type { EvmToken } from 'types/token'

import { Acknowledge } from './acknowledge'

type Props = {
  canWithdraw: boolean
  isRunningOperation: boolean
  token: EvmToken
  validationError?: string
} & ComponentProps<typeof Acknowledge>

export const SubmitWithdraw = function ({
  acknowledged,
  canWithdraw,
  isRunningOperation,
  setAcknowledged,
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
    <div className="flex w-full flex-col gap-y-2 [&>button]:w-full">
      <Acknowledge
        acknowledged={acknowledged}
        setAcknowledged={setAcknowledged}
      />
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
