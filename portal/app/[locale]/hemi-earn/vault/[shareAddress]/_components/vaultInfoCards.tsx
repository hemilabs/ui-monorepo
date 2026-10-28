import { ArrowGrowingIcon } from 'components/icons/arrowGrowingIcon'
import { TotalDepositsIcon } from 'components/icons/totalDepositsIcon'
import { StatCard } from 'components/statCard'
import { useTranslations } from 'use-intl'
import { formatApyDisplay, formatFiatNumber } from 'utils/format'

import { RenderEarnFiatBalance } from '../../../_components/earnFiatBalance'
import { RiskWarningTooltip } from '../../../_components/riskWarningTooltip'
import { type EarnVault } from '../../../types'

type Props = {
  vault: EarnVault
}

export const VaultInfoCards = function ({ vault }: Props) {
  const t = useTranslations('hemi-earn')

  return (
    <div className="flex w-full flex-col items-stretch gap-4 sm:flex-row md:gap-5">
      <div className="flex-1">
        <StatCard
          icon={<TotalDepositsIcon />}
          isError={false}
          isLoading={false}
          label={t('pool.total-deposits')}
          value={
            <RenderEarnFiatBalance
              balance={vault.totalDeposits}
              customFormatter={usd => `$${formatFiatNumber(usd)}`}
              queryStatus={vault.totalDepositsStatus}
              token={vault.peggedToken}
            />
          }
        />
      </div>
      <div className="flex-1">
        <StatCard
          icon={<ArrowGrowingIcon />}
          isError={vault.apy === null}
          isLoading={vault.apy === undefined}
          label={
            <div className="flex items-center gap-x-1">
              {t('pool.apy')}
              <RiskWarningTooltip />
            </div>
          }
          value={
            typeof vault.apy === 'number' ? formatApyDisplay(vault.apy) : null
          }
        />
      </div>
    </div>
  )
}
