import { ArrowGrowingIcon } from 'components/icons/arrowGrowingIcon'
import { TotalDepositsIcon } from 'components/icons/totalDepositsIcon'
import { StatCard } from 'components/statCard'
import { useTranslations } from 'use-intl'
import { formatApyDisplay, formatFiatNumber } from 'utils/format'

import { ApySourceLabel } from '../../../_components/apySourceLabel'
import { RenderEarnFiatBalance } from '../../../_components/earnFiatBalance'
import { VaultDetails } from '../../../_components/vaultDetails'
import { type EarnVault } from '../../../types'

type Props = {
  vault: EarnVault
}

export const VaultInfoCards = function ({ vault }: Props) {
  const t = useTranslations('hemi-earn')

  return (
    <div className="flex w-full flex-col gap-4 md:gap-5">
      <div className="flex w-full flex-col items-stretch gap-4 sm:flex-row md:gap-5">
        <div className="flex-1">
          <StatCard
            icon={<TotalDepositsIcon />}
            isError={false}
            isLoading={false}
            label={t('vault.total-deposits')}
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
            isError={!vault.isListed || vault.apy === null}
            isLoading={vault.isListed && vault.apy === undefined}
            label={
              <div className="flex items-center gap-x-1">
                <ApySourceLabel stakingVault={vault.stakingVault} />
              </div>
            }
            value={
              typeof vault.apy === 'number' ? formatApyDisplay(vault.apy) : null
            }
          />
        </div>
      </div>
      <VaultDetails stakingVault={vault.stakingVault} />
    </div>
  )
}
