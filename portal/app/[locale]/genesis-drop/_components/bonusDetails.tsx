import { OrangeCheckIcon } from 'components/icons/orangeCheckIcon'
import { LockupMonths } from 'genesis-drop-actions'
import { useTranslations } from 'next-intl'
import { ReactNode } from 'react'

import { useHemiToken } from '../_hooks/useHemiToken'
import { PercentageApyStakedHemi } from '../_utils'

import { BonusHemiTooltip } from './bonusHemiTooltip'
import { Incentives } from './incentives'
import { StakedHemiTooltip } from './stakedHemiTooltip'

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

export const SimpleBonus = function ({ amount }: { amount: ReactNode }) {
  const t = useTranslations('genesis-drop.claim-options')
  return (
    <Container bgColor="bg-neutral-50">
      <BonusDetail
        text={t.rich('bonus-staked-for-6-months', {
          amount: () => amount,
        })}
      />
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
  return (
    <Container bgColor="bg-white">
      <BonusDetail
        text={t.rich(`bonus-staked-for-${lockupMonths}-months`, {
          amount: () => amount,
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
        content={<StakedHemiTooltip />}
        text={t('apy-in-ve-hemi', {
          percentage: PercentageApyStakedHemi,
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
