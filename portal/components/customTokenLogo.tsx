import { HemiSubLogo } from 'components/hemiSubLogo'
import { Token } from 'types/token'

// Prefer ordering these by value rather than by key
/* eslint-disable sort-keys */
const sizes = {
  small: 'size-5 text-[6px]',
  medium: 'size-6 text-[7px]',
  large: 'size-8 text-[8px]',
} as const
/* eslint-enable sort-keys */

type Size = keyof typeof sizes

type Props = {
  size: Size
  token: Token
}

export const CustomTokenLogo = ({ size, token }: Props) => (
  <>
    <div
      className={`flex items-center justify-center rounded-full ${sizes[size]} overflow-hidden text-ellipsis whitespace-nowrap
      border border-solid border-white bg-neutral-50 text-[8px] font-semibold text-neutral-700`}
    >
      {token.symbol}
    </div>
    <HemiSubLogo size={size} token={token} />
  </>
)
