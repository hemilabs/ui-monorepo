'use client'

import { ErrorBoundary } from 'components/errorBoundary'
import { ExternalLink } from 'components/externalLink'
import { useNetworkType } from 'hooks/useNetworkType'
import { useUmami } from 'hooks/useUmami'
import { type MouseEvent } from 'react'
import useLocalStorageState from 'use-local-storage-state'

import { EarnRewards } from './earnRewards'

const MerkleUrl = 'https://app.merkl.xyz/?chain=43111'

export const EarnCard = function () {
  const [hideEarnRewardsCard, setHideEarnRewardsCard] = useLocalStorageState(
    'portal.hide-earn-rewards-merkle-card',
    {
      defaultValue: false,
    },
  )
  const [networkType] = useNetworkType()
  const { track } = useUmami()

  // No need to show this on testnet
  if (hideEarnRewardsCard || networkType === 'testnet') {
    return null
  }

  const navigate = function (e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    e.stopPropagation()

    track?.('earn rewards - open link')

    window.open(MerkleUrl, '_blank', 'noopener,noreferrer')
  }

  const close = function () {
    setHideEarnRewardsCard(true)

    track?.('earn rewards - close')
  }

  return (
    <ErrorBoundary>
      <div className="group/card-image h-22 fixed bottom-10 right-6 z-20 max-w-64 cursor-pointer">
        <ExternalLink href={MerkleUrl} onClick={navigate}>
          <EarnRewards onClose={close} />
        </ExternalLink>
      </div>
    </ErrorBoundary>
  )
}
