'use client'

import { useUmami } from 'app/analyticsEvents'
import { Link } from 'components/link'
import { useNetworkType } from 'hooks/useNetworkType'
import { usePathnameWithoutLocale } from 'hooks/usePathnameWithoutLocale'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { type MouseEvent } from 'react'
import useLocalStorageState from 'use-local-storage-state'
import { isStakeEnabledOnTestnet } from 'utils/stake'

import stakeAndEarn from '../_images/stakeAndEarn.png'
import stakeAndEarnHovered from '../_images/stakeAndEarnHovered.png'

const appearingElementsCss =
  'opacity-0 transition-opacity duration-300 group-hover/card-image:visible group-hover/card-image:opacity-100'

const CloseButton = ({
  onClick,
}: {
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
}) => (
  <button
    className={`${appearingElementsCss} group/close-button absolute right-2.5 top-2 z-10 flex h-5
    w-5 items-center justify-center rounded-full bg-white/50 backdrop-blur-sm`}
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

export const StakeAndEarnCard = function () {
  const locale = useLocale()
  const [hideEarnAndStakeLink, setHideEarnAndStakeLink] = useLocalStorageState(
    'portal.hide-earn-and-stake-link',
    {
      defaultValue: false,
    },
  )
  const [networkType] = useNetworkType()
  const pathname = usePathnameWithoutLocale()
  const router = useRouter()
  const { track } = useUmami()

  const stakeEnabledOnTestnet = isStakeEnabledOnTestnet(networkType)

  // No need to show this on Stake pages, nor on testnet, unless enabled
  if (
    hideEarnAndStakeLink ||
    pathname.startsWith('/stake') ||
    !stakeEnabledOnTestnet
  ) {
    return null
  }

  const hideCard = function <T extends MouseEvent>(e: T) {
    e.preventDefault()
    e.stopPropagation()

    setHideEarnAndStakeLink(true)
  }

  const close = function (e: MouseEvent<HTMLButtonElement>) {
    hideCard(e)
    track?.('stake - close stake and earn card')
  }

  const navigate = function (e: MouseEvent<HTMLAnchorElement>) {
    hideCard(e)

    track?.('stake - click stake and earn card')

    router.push(`/${locale}/stake`)
  }

  return (
    <div className="group/card-image h-22 fixed bottom-8 right-8 max-w-64 cursor-pointer">
      <Link href="/stake" onClick={navigate}>
        <Image
          alt="Stake and Earn"
          className="absolute opacity-100 transition-opacity duration-300 group-hover/card-image:opacity-0"
          quality={100}
          src={stakeAndEarn}
        />
        <Image
          alt="Stake and Earn"
          className={appearingElementsCss}
          quality={100}
          src={stakeAndEarnHovered}
        />
        <CloseButton onClick={close} />
      </Link>
    </div>
  )
}
