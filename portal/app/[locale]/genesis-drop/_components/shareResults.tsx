'use client'

import { ButtonLink } from 'components/button'
import { useUmami } from 'hooks/useUmami'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { MouseEvent } from 'react'

const Icon = () => (
  <svg
    fill="none"
    height="10"
    viewBox="0 0 10 10"
    width="10"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clip-path="url(#clip0_14930_2237)">
      <path
        d="M7.875 0H9.40875L6.05875 4.23625L10 10H6.91437L4.4975 6.50375L1.73187 10H0.1975L3.78062 5.46875L0 0H3.16438L5.34875 3.19625L7.875 0ZM7.3375 8.985H8.1875L2.70187 0.961875H1.79062L7.3375 8.985Z"
        fill="#737373"
      />
    </g>
    <defs>
      <clipPath id="clip0_14930_2237">
        <rect fill="white" height="10" width="10" />
      </clipPath>
    </defs>
  </svg>
)

type Props = {
  amount: string
  symbol: string
}

export const ShareResults = function ({ amount, symbol }: Props) {
  const pathname = usePathname()
  const t = useTranslations('genesis-drop')
  const { track } = useUmami()

  // pathname already includes the "/""
  const mainUrl = `${window.location.origin}${pathname}`
  const tweetText = t('share-x-text', {
    amount,
    symbol,
  })
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
    mainUrl,
  )}&text=${encodeURIComponent(tweetText)}`

  const handleShare = function (e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    e.stopPropagation()
    track?.('genesis-drop - share eligibility')
    window.open(twitterUrl, '_blank')
  }

  return (
    <div className="mt-4 w-fit max-w-xs">
      <ButtonLink href={twitterUrl} onClick={handleShare} variant="secondary">
        <span>
          {t.rich('share-on-x', {
            x: () => <Icon />,
          })}
        </span>
        <Icon />
      </ButtonLink>
    </div>
  )
}
