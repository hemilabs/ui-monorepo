'use client'

import { ButtonLink } from 'components/button'
import { usePathname } from 'i18n/navigation'
import { useTranslations } from 'next-intl'

const Icon = () => (
  <svg
    className="mb-1"
    fill="none"
    height={32}
    width={32}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect fill="#FFF6ED" height={32} rx={16} width={32} />
    <g filter="url(#filter0_i_14227_26767)">
      <path
        d="M17.983 7.907a.75.75 0 0 0-1.292-.657l-8.5 9.5A.75.75 0 0 0 8.75 18h6.572l-1.305 6.093a.75.75 0 0 0 1.292.657l8.5-9.5A.75.75 0 0 0 23.25 14h-6.572l1.305-6.093Z"
        fill="#FF6C15"
      />
    </g>
    <defs>
      <filter
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
        height={17.999}
        id="filter0_i_14227_26767"
        width={16}
        x={8}
        y={7.001}
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feColorMatrix
          in="SourceAlpha"
          result="hardAlpha"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        />
        <feOffset />
        <feGaussianBlur stdDeviation={0.5} />
        <feComposite in2="hardAlpha" k2={-1} k3={1} operator="arithmetic" />
        <feColorMatrix values="0 0 0 0 0.270588 0 0 0 0 0.0666667 0 0 0 0 0.0196078 0 0 0 0.24 0" />
        <feBlend in2="shape" result="effect1_innerShadow_14227_26767" />
      </filter>
    </defs>
  </svg>
)

export const ClaimRewardsDisabledTestnet = function () {
  const pathname = usePathname()
  const t = useTranslations('rewards-page')
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-y-1">
      <Icon />
      <h2 className="text-lg font-semibold text-neutral-950">
        {t('only-live-on-mainnet')}
      </h2>
      <p className="mb-3 max-w-44 text-center text-sm font-medium text-neutral-500 sm:max-w-64 md:max-w-72 lg:max-w-72 xl:max-w-full">
        {t('switch-to-start-claiming')}
      </p>
      <ButtonLink href={{ pathname, query: { networkType: 'mainnet' } }}>
        {t('switch-to-mainnet')}
      </ButtonLink>
    </div>
  )
}
