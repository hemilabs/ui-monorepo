import { HemiSubLogo } from 'components/hemiSubLogo'
import { type Token } from 'token-list'

const sizes = {
  medium: 'h-8 w-8 text-[8px]',
  small: 'h-5 w-5 text-[6px]',
} as const

type Size = keyof typeof sizes

type Props = {
  size: Size
  token: Token
}

export const CustomTokenLogo = ({ token, size }: Props) => (
  <>
    <div
      className={`flex items-center justify-center rounded-full ${sizes[size]} overflow-hidden text-ellipsis whitespace-nowrap
      border border-solid border-white bg-neutral-50 text-[8px] font-bold text-neutral-700`}
    >
      {token.symbol}
    </div>
    <HemiSubLogo token={token} />
  </>
)
