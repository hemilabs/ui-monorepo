import { StakeIcon } from 'components/icons/stakeIcon'
import { useTranslations } from 'next-intl'

import { ItemAccordion } from './itemAccordion'

export const Stake = function () {
  const t = useTranslations('navbar')

  return (
    <li>
      <ItemAccordion
        icon={<StakeIcon />}
        items={[
          {
            event: 'nav - staking dashboard',
            href: '/staking-dashboard',
            text: t('hemi-staking'),
            urlToBeSelected: '/staking-dashboard',
          },
          {
            event: 'nav - stake',
            href: '/stake/dashboard',
            text: t('boost-staking'),
            urlToBeSelected: '/stake',
          },
        ]}
        text={t('stake')}
      />
    </li>
  )
}
