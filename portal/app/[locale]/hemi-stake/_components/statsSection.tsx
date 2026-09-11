import { useTranslations } from 'use-intl'

import { AverageLockup } from './averageLockup'
import { RewardsPaid } from './rewardsPaid'
import { TotalStaked } from './totalStaked'
import { WalletsStaking } from './walletsStaking'

export const StatsSection = function () {
  const t = useTranslations('hemi-stake.stats')

  return (
    <section className="mt-8 flex w-full flex-col gap-y-4">
      <h3>{t('heading')}</h3>
      <div className="grid w-full grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4 [&>.card-container]:min-w-0">
        <TotalStaked />
        <WalletsStaking />
        <AverageLockup />
        <RewardsPaid />
      </div>
    </section>
  )
}
