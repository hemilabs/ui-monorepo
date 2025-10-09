'use client'

import { useHemi } from 'hooks/useHemi'
import { Token } from 'types/token'

// Prefer ordering these by value rather than by key
/* eslint-disable sort-keys */
const sizes = {
  small: 'size-2.5',
  medium: 'size-3',
  large: 'size-4',
} as const
/* eslint-enable sort-keys */

type Props = {
  size: keyof typeof sizes
  token: Token
}

const HemiLogo = ({ size }: Pick<Props, 'size'>) => (
  <svg
    className={sizes[size]}
    fill="none"
    height="10"
    viewBox="0 0 10 10"
    width="10"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect fill="#FFEBD4" height="9" rx="2.5" width="9" x="0.5" y="0.5" />
    <rect height="9" rx="2.5" stroke="white" width="9" x="0.5" y="0.5" />
    <path
      d="M5.57675 2.00091C5.54587 1.99536 5.5168 2.01571 5.51135 2.04715L5.13896 4.19821H4.86103L4.48865 2.04715C4.4832 2.01571 4.45413 1.99536 4.42325 2.00091C3.10082 2.2617 2.08719 3.40844 2.00363 4.81042C2.00363 4.81227 2 4.87145 2 4.90105C2 4.90475 2 4.90845 2 4.9103C2 4.92139 2 4.93249 2 4.94359C2 4.94729 2 4.95099 2 4.95654C2 4.97133 2 4.98428 2 4.99908C2 6.48614 3.04269 7.7235 4.42507 7.99724C4.45595 8.00279 4.48501 7.98244 4.49046 7.951L4.86285 5.79994H5.14078L5.51135 7.95285C5.5168 7.98429 5.54587 8.00464 5.57675 7.99909C6.89918 7.73645 7.91099 6.58971 7.99636 5.18773C7.99636 5.18588 8 5.1267 8 5.0971C8 5.0934 8 5.0897 8 5.08785C8 5.07676 8 5.06566 8 5.05456C8 5.05086 8 5.04716 8 5.04162C8 5.02682 8 5.01387 8 4.99908C8.00181 3.51202 6.95913 2.27465 5.57675 2.00091Z"
      fill="#FF6C15"
    />
  </svg>
)

export const HemiSubLogo = function ({ size, token }: Props) {
  const hemi = useHemi()
  if (token.chainId !== hemi.id) {
    return null
  }
  return (
    <div className="absolute bottom-0 right-0">
      <HemiLogo size={size} />
    </div>
  )
}
