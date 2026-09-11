import { StakeIcon } from 'components/icons/stakeIcon'
import { useTranslations } from 'use-intl'

import { ItemLink } from './itemLink'

export const BoostStaking = function () {
  const t = useTranslations('navbar')

  return (
    <ItemLink
      event="nav - stake"
      href="/stake/dashboard"
      icon={
        <div className="w-8 md:w-3">
          <StakeIcon />
        </div>
      }
      text={t('boost-staking')}
      urlToBeSelected="/stake"
    />
  )
}
