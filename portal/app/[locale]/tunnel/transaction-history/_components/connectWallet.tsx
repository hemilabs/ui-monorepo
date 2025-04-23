import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useUmami } from 'app/analyticsEvents'
import { Button } from 'components/button'
import { useNetworkType } from 'hooks/useNetworkType'
import { useTranslations } from 'next-intl'

import { EmptyState } from './emptyState'

const WalletIcon = () => (
  <svg
    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
    fill="none"
    height={16}
    width={19}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#wallet_icon_filter)">
      <path
        d="M.5 2.25a3.733 3.733 0 0 1 2.25-.75h13.5c.844 0 1.623.279 2.25.75A2.25 2.25 0 0 0 16.25 0H2.75A2.25 2.25 0 0 0 .5 2.25Zm0 3a3.733 3.733 0 0 1 2.25-.75h13.5c.844 0 1.623.279 2.25.75A2.25 2.25 0 0 0 16.25 3H2.75A2.25 2.25 0 0 0 .5 5.25Zm6 .75a1 1 0 0 1 1 1 2 2 0 1 0 4 0 1 1 0 0 1 1-1h3.75a2.25 2.25 0 0 1 2.25 2.25v5.5A2.249 2.249 0 0 1 16.25 16H2.75A2.25 2.25 0 0 1 .5 13.75v-5.5A2.25 2.25 0 0 1 2.75 6H6.5Z"
        fill="#FF6C15"
      />
    </g>
    <defs>
      <filter
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
        height={16}
        id="wallet_icon_filter"
        width={18}
        x={0.5}
        y={0}
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
        <feBlend in2="shape" result="effect1_innerShadow_5267_6153" />
      </filter>
    </defs>
  </svg>
)

export const ConnectWallet = function () {
  const { openConnectModal } = useConnectModal()
  const [networkType] = useNetworkType()
  const t = useTranslations()
  const { track } = useUmami()

  const onClick = function () {
    openConnectModal()
    track?.('evm connect', { chain: networkType })
  }

  return (
    <EmptyState
      action={
        <Button height="h-6" onClick={onClick} type="button">
          {t('common.connect-wallet')}
        </Button>
      }
      icon={<WalletIcon />}
      subtitle={t('transaction-history.connect-wallet-to-review')}
      title={t('common.your-wallet-not-connected')}
    />
  )
}
