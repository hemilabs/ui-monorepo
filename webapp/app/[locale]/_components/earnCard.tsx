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
    className="group/close-button absolute right-2.5 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-white/50
    backdrop-blur-sm md:opacity-0 md:transition-opacity md:duration-300 md:group-hover/card-image:visible md:group-hover/card-image:opacity-100"
    onClick={onClick}
    type="button"
  >
    <svg fill="none" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
      <path
        className="fill-neutral-500 group-hover/close-button:fill-neutral-950"
        d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z"
      />
    </svg>
  </button>
)

export const EarnCard = function () {
  const [hideEarnAndStakeLink, setHideEarnAndStakeLink] = useLocalStorageState(
    'portal.hide-earn-points-card',
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

  const hideCard = function <T extends MouseEvent>(e: T) {
    e.preventDefault()
    e.stopPropagation()

    setHideEarnAndStakeLink(true)
  }

  const close = function (e: MouseEvent<HTMLButtonElement>) {
    hideCard(e)
    track?.('stake - close earn points card')
  }

  const absintheUrl = 'https://boost.absinthe.network/hemi-mainnet/dashboard'

  const navigate = function (e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    e.stopPropagation()

    hideCard(e)

    track?.('stake - click earn points card')

    window.open(absintheUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="group/card-image h-22 fixed bottom-8 right-8 z-10 max-w-64 cursor-pointer">
      <ExternalLink href={absintheUrl} onClick={navigate}>
        <EarnPoints className="absolute opacity-100 transition-opacity duration-300 group-hover/card-image:opacity-0" />
        <EarnPointsHovered className="opacity-0 transition-opacity duration-300 group-hover/card-image:visible group-hover/card-image:opacity-100" />
        <CloseButton onClick={close} />
      </ExternalLink>
    </div>
  )
}
