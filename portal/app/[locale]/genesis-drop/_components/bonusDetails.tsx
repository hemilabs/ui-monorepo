import { OrangeCheckIcon } from 'components/icons/orangeCheckIcon'
import { LockupMonths } from 'genesis-drop-actions'
import { useHemiToken } from 'hooks/useHemiToken'
import { useTranslations } from 'next-intl'
import { ReactNode } from 'react'

import { getMultiplier } from '../_utils'

import { BonusHemiTooltip } from './bonusHemiTooltip'
import { Incentives } from './incentives'
import { MultiplierRewardsTooltip } from './multiplierRewardsTooltip'

const Container = ({
  bgColor,
  children,
}: {
  bgColor: string
  children: ReactNode
}) => (
  <div
    className={`flex h-full flex-col gap-y-3 rounded-b-lg p-6 text-sm font-medium ${bgColor}`}
  >
    {children}
  </div>
)

const BonusDetail = ({
  content,
  text,
}: {
  content?: ReactNode
  text: ReactNode
}) => (
  <div className="flex items-center gap-x-1.5">
    <OrangeCheckIcon size="small" />
    <span className="flex items-center gap-x-1 text-neutral-950">{text}</span>
    {content}
  </div>
)

export const SimpleBonus = function ({
  amount,
  lockupMonths,
}: {
  amount: ReactNode
  lockupMonths: LockupMonths
}) {
  const { symbol } = useHemiToken()
  const t = useTranslations('genesis-drop.claim-options')
  return (
    <Container bgColor="bg-neutral-50">
      <BonusDetail
        text={t.rich('tokens-available-now-amount', {
          amount: () => amount,
          symbol,
        })}
      />
      <BonusDetail
        text={t.rich('bonus-staked-for-months', {
          amount: () => amount,
          months: () => lockupMonths,
          symbol: () => symbol,
        })}
      />
      <BonusDetail text={t('potential-staked-rewards', { symbol })} />
    </Container>
  )
}
export const FullBonus = function ({
  amount,
  bonus,
  lockupMonths,
}: {
  amount: ReactNode
  bonus: ReactNode
  lockupMonths: LockupMonths
}) {
  const { symbol } = useHemiToken()
  const t = useTranslations('genesis-drop.claim-options')
  const multiplier = getMultiplier(lockupMonths)
  return (
    <Container bgColor="bg-white">
      <BonusDetail
        text={t.rich(`tokens-available-now-amount`, {
          amount: () => amount,
          symbol,
        })}
      />
      <BonusDetail
        text={t.rich('bonus-staked-for-months', {
          amount: () => amount,
          months: () => lockupMonths,
          symbol: () => symbol,
        })}
      />
      <BonusDetail
        content={<MultiplierRewardsTooltip multiplier={multiplier} />}
        text={t('up-to-multiplier-rewards', {
          multiplier,
        })}
      />
      <BonusDetail
        content={<BonusHemiTooltip bonus={bonus} />}
        text={t.rich('more-rewards', {
          bonus: () => bonus,
          symbol,
        })}
      />
      <BonusDetail
        content={<Incentives />}
        text={t('future-incentives-from')}
      />
    </Container>
  )
}
