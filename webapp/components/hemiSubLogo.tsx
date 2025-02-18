'use client'

import { useHemi } from 'hooks/useHemi'
import { type Token } from 'token-list'

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

type Props = {
  token: Token
}

export const HemiSubLogo = function ({ token }: Props) {
  const hemi = useHemi()
  if (token.chainId !== hemi.id) {
    return null
  }
  return (
    <div className="absolute -bottom-0.5 -right-0.5">
      <HemiLogo />
    </div>
  )
}
