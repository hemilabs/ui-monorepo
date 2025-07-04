'use client'

import { ExternalLink } from 'components/externalLink'
import { useNetworkType } from 'hooks/useNetworkType'
import { useUmami } from 'hooks/useUmami'
import { type MouseEvent } from 'react'
import useLocalStorageState from 'use-local-storage-state'
import { isStakeEnabledOnTestnet } from 'utils/stake'

import { EarnPoints } from './earnPoints'

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

  const absintheUrl = 'https://boost.absinthe.network/hemi-mainnet/dashboard'

  const navigate = function (e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    e.stopPropagation()

    track?.('stake - click earn points card')

    window.open(absintheUrl, '_blank', 'noopener,noreferrer')
  }

  const close = function () {
    setHideEarnAndStakeLink(true)

    track?.('stake - close earn points card')
  }

  return (
    <div className="group/card-image h-22 fixed bottom-8 right-8 z-20 max-w-64 cursor-pointer">
      <ExternalLink href={absintheUrl} onClick={navigate}>
        <EarnPoints onClose={close} />
      </ExternalLink>
    </div>
  )
}
