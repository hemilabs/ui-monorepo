import Image from 'next/image'
import { type Token } from 'token-list'

import { CustomTokenLogo } from './customTokenLogo'
import { HemiSubLogo } from './hemiSubLogo'

const sizes = {
  medium: 'h-8 w-8',
  small: 'h-5 w-5 [&>div:nth-child(2)]:h-2.5 [&>div:nth-child(2)]:w-2.5',
} as const

type Size = keyof typeof sizes

type Props = {
  size: Size
  token: Token
}

// for hemi tokens, we add a hemi logo at the bottom right
export const TokenLogo = ({ size, token }: Props) =>
  token.logoURI ? (
    <div className={`relative ${sizes[size]}`}>
      <Image
        alt={`${token.symbol} Logo`}
        className="w-full"
        height={20}
        src={token.logoURI}
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
