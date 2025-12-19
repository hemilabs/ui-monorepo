'use client'

import { useHemi } from 'hooks/useHemi'
import { orange600 } from 'styles'
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
    viewBox="0 0 20 20"
    width="10"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11.6609 0.142092L10.4435 7.29861H9.51303L8.29564 0.142092C8.27825 0.0464394 8.19129 -0.0144302 8.09564 0.00296114C3.39998 0.889918 -1.52588e-05 5.01166 -1.52588e-05 9.97687C-1.52588e-05 14.9421 3.39998 19.0638 8.10433 19.9508C8.19998 19.9682 8.28694 19.9073 8.30433 19.8117L9.52172 12.6551H10.4522L11.6695 19.8117C11.6869 19.9073 11.7739 19.9682 11.8695 19.9508C16.5739 19.0725 19.9739 14.9421 19.9739 9.97687C19.9739 5.01166 16.5652 0.889918 11.8609 0.00296114C11.7652 -0.0144302 11.6782 0.0464394 11.6609 0.142092Z"
      fill={orange600}
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
