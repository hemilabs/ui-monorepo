import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Token } from 'types/token'

import { CustomTokenLogo } from './customTokenLogo'
import { HemiSubLogo } from './hemiSubLogo'
import { BtcLogo } from './icons/btcLogo'

const sizes = {
  medium: 'h-8 w-8',
  small: 'h-5 w-5 [&>div:nth-child(2)]:h-2.5 [&>div:nth-child(2)]:w-2.5',
} as const

type Size = keyof typeof sizes

type Props = {
  size: Size
  token: Token
}

type ImageState = 'idle' | 'loaded' | 'error'

const MaxRetries = 5

// for hemi tokens, we add a hemi logo at the bottom right
export function TokenLogo({ size, token }: Props) {
  const [imageState, setImageState] = useState<ImageState>('idle')
  const [retry, setRetry] = useState(0)

  useEffect(
    function retryImageEffect() {
      let timer: NodeJS.Timeout | null = null
      if (imageState === 'error' && retry <= MaxRetries) {
        timer = setTimeout(function forceReload() {
          setImageState('idle')
          setRetry(r => r + 1)
        }, 10 * 1000)
      }
      return function () {
        if (timer) clearTimeout(timer)
      }
    },
    [imageState, retry, setRetry, setImageState],
  )

  // BTC and tBTC are special cases
  // We use a preset logo for them
  if (['btc', 'tbtc'].includes(token.symbol.toLowerCase())) {
    return (
      <div className={`relative ${sizes[size]}`}>
        <div className="flex h-full w-full items-center justify-center">
          <BtcLogo className="h-full w-full" />
        </div>
      </div>
    )
  }

  return token.logoURI && imageState !== 'error' ? (
    <div className={`relative ${sizes[size]}`}>
      <Image
        alt={`${token.symbol} Logo`}
        className="w-full"
        height={20}
        onError={() => setImageState('error')}
        onLoad={() => setImageState('loaded')}
        src={`${token.logoURI}${retry === 0 ? '' : `?retry=${retry}`}`}
        width={20}
      />
      {/* for custom tokens, it is already included in the component */}
      <HemiSubLogo token={token} />
    </div>
  ) : (
    <div className={`relative ${sizes[size]}`}>
      <CustomTokenLogo size={size} token={token} />
    </div>
  )
}
