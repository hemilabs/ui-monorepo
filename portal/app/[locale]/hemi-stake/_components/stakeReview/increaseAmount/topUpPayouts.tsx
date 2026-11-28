import { useHemiToken } from 'hooks/useHemiToken'
import { useTranslations } from 'use-intl'
import { parseTokenUnits } from 'utils/token'

import { useStakingDashboard } from '../../../_context/stakingDashboardContext'
import { useTopUpForecast } from '../../../_hooks/useTopUpForecast'
import { StackedPayouts } from '../stackedPayouts'

export const TopUpPayouts = function () {
  const t = useTranslations('hemi-stake.estimated-payouts')
  const token = useHemiToken()
  const { stakingDashboardOperation } = useStakingDashboard()

  const forecast = useTopUpForecast({
    addedAmount: parseTokenUnits(
      stakingDashboardOperation?.input ?? '0',
      token,
    ),
    tokenId: stakingDashboardOperation?.stakingPosition?.tokenId,
  })

  return (
    <StackedPayouts
      {...forecast}
      addedLabel={t('added-amount', { symbol: token.symbol })}
      tooltipId="top-up-payouts-apy"
    />
  )
}
