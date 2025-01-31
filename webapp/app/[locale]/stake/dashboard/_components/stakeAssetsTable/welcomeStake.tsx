import { Card } from 'components/card'
import { useTranslations } from 'next-intl'

import { StakeAndEarnPointsSpecialLabel } from '../../../../stake/_components/stakeAndEarnPointsSpecialLabel'
import { StakeAndEarnPointsGraphIcon } from '../../../_components/icons/stakeAndEarnPointsGraph'
import { StarIcon } from '../../../_components/icons/star'
import welcomeStakeBackgroundImg from '../../../_images/welcome_stake_background.png'

interface Props {
  onClick: VoidFunction
}

export function StakeButton({ onClick }: Props) {
  const t = useTranslations('stake-page.dashboard')
  return (
    <button
      className="relative flex w-full items-center justify-center rounded-lg bg-[#FFD9D0] px-6 py-3 transition-all duration-300 ease-in-out hover:scale-110 hover:opacity-90"
      onClick={onClick}
    >
      <span className="relative z-10 text-lg font-normal text-orange-600">
        {t('stake')}
      </span>
      <div className="absolute inset-0 overflow-visible">
        <StarIcon
          className="absolute -top-2 right-32 -translate-x-1 -translate-y-1 lg:right-2"
          rotation={45}
          size={14}
        />
        <StarIcon
          className="absolute -bottom-2 left-32 translate-x-3 translate-y-2 lg:left-2"
          rotation={90}
          size={18}
        />
        <StarIcon
          className="right-30 absolute bottom-2 translate-x-4 translate-y-1 lg:-right-2"
          rotation={60}
          size={16}
        />
        <StarIcon
          className="absolute left-32 top-1 -translate-x-1 -translate-y-2 lg:left-2"
          rotation={100}
          size={12}
        />
      </div>
    </button>
  )
}

export const WelcomeStake = ({ onClick }: Props) => (
  <Card>
    <div className="relative flex h-[60dvh] flex-col items-center justify-center gap-6 overflow-hidden rounded-2xl bg-neutral-100 p-4 md:h-[55dvh] lg:h-[50dvh]">
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `url(${welcomeStakeBackgroundImg.src}) lightgray 50% / cover no-repeat`,
          mixBlendMode: 'overlay',
          opacity: 0.72,
        }}
      />
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            'radial-gradient(100% 100% at 50% 0%, rgba(253, 239, 232, 0.08) 14.89%, rgba(255, 108, 21, 0.12) 54.52%, rgba(255, 24, 20, 0.03) 98.87%)',
        }}
      />
      <div className="relative z-20 mt-6 flex flex-col items-center md:mt-14 md:gap-x-14 lg:mt-0 lg:flex-row">
        <div className="order-1">
          <StakeAndEarnPointsSpecialLabel />
        </div>
        <div className="order-2 mt-8 w-full md:bottom-6 lg:absolute lg:bottom-3 lg:left-0 lg:order-3 lg:mt-0 lg:w-auto">
          <StakeButton onClick={onClick} />
        </div>
        <div className="order-3 lg:order-2">
          <StakeAndEarnPointsGraphIcon />
        </div>
      </div>
    </div>
  </Card>
)
