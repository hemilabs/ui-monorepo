import { Card } from 'components/card'
import { useTranslations } from 'next-intl'

import { StakeAndEarnPointsGraphIcon } from '../../../_components/icons/stakeAndEarnPointsGraph'
import welcomeStakeBackgroundImg from '../../../_images/welcome_stake_background.png'

interface Props {
  onClick: VoidFunction
}

interface StarIconProps {
  className: string
  color?: string
  rotation?: number
  size?: number
}

const StarIcon = ({
  className,
  color = '#FF6014',
  rotation = 0,
  size = 14,
}: StarIconProps) => (
  <svg
    className={className}
    fill={color}
    height={size}
    style={rotation !== 0 ? { transform: `rotate(${rotation}deg)` } : undefined}
    viewBox="0 0 24 24"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2c.34 0 .68.16.88.48l2.5 4.62 5.08.74c.96.14 1.34 1.32.64 1.99l-3.68 3.58.87 5.06c.17.98-.87 1.72-1.75 1.26L12 17.77l-4.54 2.38c-.88.46-1.92-.28-1.75-1.26l.87-5.06-3.68-3.58c-.7-.67-.32-1.85.64-1.99l5.08-.74 2.5-4.62A1.01 1.01 0 0 1 12 2z" />
  </svg>
)

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

function GradientLabel() {
  const t = useTranslations('stake-page.dashboard')
  const labelParts = t('stake-earn-points-label').split('|')

  // This function is designed to render a gradient label with a special behavior for the letter 'i'.
  // If the second part of the label (labelParts[1]) contains the letter 'i', a star icon is rendered
  // above it. However, in cases where the translation does not include the letter 'i' (e.g., in Spanish),
  // a conditional logic ensures that the label is rendered correctly without the star icon.

  return (
    <div className="relative bg-gradient-to-r from-[#FF7849] to-[#FF9454] bg-clip-text text-center font-bold leading-tight text-transparent lg:text-left">
      <div className="text-6xl">{labelParts[0]}</div>
      <div className="text-6xl">
        {labelParts[2].includes('i') ? (
          <>
            {labelParts[1].replace('i', '')}
            <span className="relative inline-block">
              <StarIcon
                className="absolute -top-[54px] left-[9px] -translate-x-1/2"
                color="#FF7849"
                size={22}
              />
            </span>
          </>
        ) : (
          labelParts[1]
        )}
        {labelParts[2]}
      </div>
    </div>
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
          <GradientLabel />
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
