import { useHemi } from 'hooks/useHemi'
import Image from 'next/image'
import { Token } from 'types/token'
import { HemiTokenWithBackground } from 'ui-common/components/hemiLogo'
import { isNativeToken } from 'utils/token'

const HemiLogo = () => (
  <svg
    className="h-full w-full"
    fill="none"
    height={16}
    viewBox="0 0 16 16"
    width={16}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      fill="#FFEBD4"
      height={13.5}
      rx={3.75}
      width={13.5}
      x={1.25}
      y={1.25}
    />
    <rect
      height={13.5}
      rx={3.75}
      stroke="#fff"
      strokeWidth={1.5}
      width={13.5}
      x={1.25}
      y={1.25}
    />
    <path
      d="M8.72 4.251a.07.07 0 0 0-.08.058l-.466 2.689h-.348l-.465-2.69a.07.07 0 0 0-.082-.057c-1.653.326-2.92 1.76-3.024 3.512 0 .002-.005.076-.005.113V8c0 1.859 1.303 3.405 3.031 3.747a.07.07 0 0 0 .082-.057l.466-2.69h.347l.463 2.692a.07.07 0 0 0 .082.058c1.653-.328 2.918-1.762 3.024-3.514 0-.003.005-.077.005-.114V8c.002-1.859-1.301-3.406-3.03-3.748Z"
      fill="#FF6C15"
    />
  </svg>
)

const sizes = {
  medium: 'h-8 w-8',
  small: 'h-5 w-5 [&>div:nth-child(2)]:h-2.5 [&>div:nth-child(2)]:w-2.5',
} as const

type Size = keyof typeof sizes

type Props = {
  size: Size
  token: Token
}

export const TokenLogo = function ({ size, token }: Props) {
  const hemi = useHemi()

  // for hemi tokens, we add a hemi logo at the bottom right
  return (
    <div className={`relative ${sizes[size]}`}>
      {token.logoURI ? (
        <Image
          alt={`${token.symbol} Logo`}
          className="w-full"
          height={20}
          src={token.logoURI}
          width={20}
        />
      ) : (
        <HemiTokenWithBackground className="h-full w-full" />
      )}
      {!isNativeToken(token) && token.chainId === hemi.id && (
        <div className="absolute -bottom-0.5 -right-0.5">
          <HemiLogo />
        </div>
      )}
    </div>
  )
}
