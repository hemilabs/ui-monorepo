import { useTranslations } from 'use-intl'

import { useStakingDashboard } from '../../../_context/stakingDashboardContext'
import { useExtendForecast } from '../../../_hooks/useExtendForecast'
import { StackedPayouts } from '../stackedPayouts'

export const ExtendPayouts = function () {
  const t = useTranslations('hemi-stake.estimated-payouts')
  const { stakingDashboardOperation } = useStakingDashboard()

  const forecast = useExtendForecast({
    lockupDays: stakingDashboardOperation?.lockupDays ?? 0,
    tokenId: stakingDashboardOperation?.stakingPosition?.tokenId,
  })

  return (
    <StackedPayouts
      {...forecast}
      addedLabel={t('added-time')}
      tooltipId="extend-payouts-apy"
    />
  )
}
