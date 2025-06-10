'use client'

import { useUmami } from 'app/analyticsEvents'
import { ExternalLink } from 'components/externalLink'
import { useNetworkType } from 'hooks/useNetworkType'
import { type MouseEvent } from 'react'
import useLocalStorageState from 'use-local-storage-state'
import { isStakeEnabledOnTestnet } from 'utils/stake'

import { EarnPoints, EarnPointsHovered } from './earnPoints'

const CloseButton = ({
  onClick,
}: {
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
}) => (
  <button
    className="group/close-button absolute right-3.5 top-3.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-white
    backdrop-blur-sm md:opacity-0 md:transition-opacity md:duration-300 md:group-hover/card-image:visible md:group-hover/card-image:opacity-100"
    onClick={onClick}
    type="button"
  >
    <svg
      fill="none"
      height="16"
      viewBox="0 0 16 16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.27918 4.22082C5.137 4.08834 4.94896 4.01622 4.75465 4.01965C4.56035 4.02308 4.37497 4.10179 4.23756 4.2392C4.10014 4.37661 4.02143 4.562 4.018 4.7563C4.01457 4.9506 4.0867 5.13865 4.21918 5.28082L6.93918 8.00082L4.21918 10.7208C4.14549 10.7895 4.08639 10.8723 4.0454 10.9643C4.0044 11.0563 3.98236 11.1556 3.98059 11.2563C3.97881 11.357 3.99733 11.457 4.03505 11.5504C4.07278 11.6438 4.12892 11.7286 4.20014 11.7999C4.27136 11.8711 4.35619 11.9272 4.44958 11.9649C4.54297 12.0027 4.643 12.0212 4.7437 12.0194C4.8444 12.0176 4.94372 11.9956 5.03572 11.9546C5.12771 11.9136 5.21052 11.8545 5.27918 11.7808L7.99918 9.06082L10.7192 11.7808C10.7878 11.8545 10.8706 11.9136 10.9626 11.9546C11.0546 11.9956 11.154 12.0176 11.2547 12.0194C11.3554 12.0212 11.4554 12.0027 11.5488 11.9649C11.6422 11.9272 11.727 11.8711 11.7982 11.7999C11.8694 11.7286 11.9256 11.6438 11.9633 11.5504C12.001 11.457 12.0195 11.357 12.0178 11.2563C12.016 11.1556 11.9939 11.0563 11.953 10.9643C11.912 10.8723 11.8529 10.7895 11.7792 10.7208L9.05918 8.00082L11.7792 5.28082C11.9117 5.13865 11.9838 4.9506 11.9804 4.7563C11.9769 4.562 11.8982 4.37661 11.7608 4.2392C11.6234 4.10179 11.438 4.02308 11.2437 4.01965C11.0494 4.01622 10.8614 4.08834 10.7192 4.22082L7.99918 6.94082L5.27918 4.22082Z"
        fill="#737373"
      />
    </svg>
  </button>
)

export const EarnCard = function () {
  const [hideEarnAndStakeLink, setHideEarnAndStakeLink] = useLocalStorageState(
    'portal.hide-earn-points-on-hemi-card',
    {
      defaultValue: false,
    },
  )
  const [networkType] = useNetworkType()
  const { track } = useUmami()

  const stakeEnabledOnTestnet = isStakeEnabledOnTestnet(networkType)

  // No need to show this on Stake pages, nor on testnet, unless enabled
  if (hideEarnAndStakeLink || !stakeEnabledOnTestnet) {
    return null
  }

  const close = function (e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()

    setHideEarnAndStakeLink(true)

    track?.('stake - close earn points card')
  }

  const absintheUrl = 'https://boost.absinthe.network/hemi-mainnet/dashboard'

  const navigate = function (e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    e.stopPropagation()

    track?.('stake - click earn points card')

    window.open(absintheUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="group/card-image h-22 fixed bottom-8 right-8 z-20 max-w-64 cursor-pointer">
      <ExternalLink href={absintheUrl} onClick={navigate}>
        <EarnPoints className="absolute opacity-100 transition-opacity duration-300 group-hover/card-image:opacity-0" />
        <EarnPointsHovered className="opacity-0 transition-opacity duration-300 group-hover/card-image:visible group-hover/card-image:opacity-100" />
        <CloseButton onClick={close} />
      </ExternalLink>
    </div>
  )
}
