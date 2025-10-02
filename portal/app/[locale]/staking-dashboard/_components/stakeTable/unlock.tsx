import { Button } from 'components/button'
import { useHemiToken } from 'hooks/useHemiToken'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import {
  type StakingPosition,
  StakingPositionStatus,
  type UnlockingOperationRunning,
} from 'types/stakingDashboard'
import { formatDate } from 'utils/format'

import { useStakingDashboard } from '../../_context/stakingDashboardContext'
import { useUnlock } from '../../_hooks/useUnlock'

const CheckIcon = () => (
  <svg fill="none" height="16" width="16" xmlns="http://www.w3.org/2000/svg">
    <path
      clipRule="evenodd"
      d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
      fill="#10B981"
      fillRule="evenodd"
    />
  </svg>
)

type Props = {
  operation: Pick<StakingPosition, 'amount' | 'status' | 'tokenId'>
  unlockDate: Date
}

export function Unlock({ operation, unlockDate }: Props) {
  const t = useTranslations('staking-dashboard')
  const locale = useLocale()
  const token = useHemiToken()
  const { amount, tokenId } = operation
  const [operationRunning, setOperationRunning] =
    useState<UnlockingOperationRunning>('idle')
  const { updateUnlockingDashboardOperation } = useStakingDashboard()

  const { mutate: runUnlock } = useUnlock({
    amount,
    on(emitter) {
      emitter.on('withdraw-transaction-reverted', () =>
        setOperationRunning('failed'),
      )
      emitter.on('user-signing-withdraw-error', () =>
        setOperationRunning('failed'),
      )
      emitter.on('unexpected-error', () => setOperationRunning('failed'))
      emitter.on('withdraw-transaction-succeeded', function () {
        setOperationRunning('idle')
      })
    },
    token,
    tokenId,
    updateUnlockingDashboardOperation,
  })

  if (operation.status === StakingPositionStatus.WITHDRAWN) {
    return (
      <div className="flex flex-col items-start">
        <div className="flex items-center">
          <CheckIcon />
          <span className="text-sm font-medium text-emerald-600">
            {t('table.burned')}
          </span>
        </div>
        <span className="text-xs font-normal text-neutral-500">
          {t('table.on', {
            date: formatDate(unlockDate, locale),
          })}
        </span>
      </div>
    )
  }

  const isUnlocking = operationRunning === 'unlocking'

  const handleUnlock = function () {
    setOperationRunning('unlocking')
    runUnlock()
  }

  return (
    <div className="mr-0.5">
      <Button disabled={isUnlocking} onClick={handleUnlock} size="small">
        {t('table.unlock')}
      </Button>
    </div>
  )
}
