import { HemiSubLogo } from 'components/hemiSubLogo'
import { Token } from 'types/token'

const sizes = {
  medium: 'size-8 text-[8px]',
  small: 'size-5 text-[6px]',
} as const

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
