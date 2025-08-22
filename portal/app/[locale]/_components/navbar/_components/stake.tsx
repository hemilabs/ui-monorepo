import { StakeIcon } from 'components/icons/stakeIcon'
import { hemi } from 'hemi-viem'
import { useHemi } from 'hooks/useHemi'
import { useTranslations } from 'next-intl'
import { Suspense } from 'react'
import { isStakeGovernanceEnabled } from 'utils/featureFlags'
import { Chain } from 'viem'

import { ItemAccordion } from './itemAccordion'
import { ItemLink } from './itemLink'

type Props = {
  chainId: Chain['id']
}

const UI = function ({ chainId }: Props) {
  const enabled = isStakeGovernanceEnabled(chainId)
  const t = useTranslations('navbar')

  if (enabled) {
    // after TGE, this will be the menu used
    return (
      <li>
        <ItemAccordion
          icon={<StakeIcon />}
          items={[
            {
              // TODO: needs to be reviewed in the future
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
  // Before TGE, this will be the menu rendered
  return (
    <li className="[&>div]:px-2">
      <ItemLink
        event="nav - stake"
        href="/stake/dashboard"
        icon={<StakeIcon />}
        text={t('stake')}
        urlToBeSelected="/stake"
      />
    </li>
  )
}

const StakeImpl = () => <UI chainId={useHemi().id} />

export const Stake = () => (
  <Suspense fallback={<UI chainId={hemi.id} />}>
    <StakeImpl />
  </Suspense>
)
