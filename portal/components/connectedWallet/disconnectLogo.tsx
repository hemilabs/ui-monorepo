import { ComponentProps } from 'react'

export const DisconnectLogo = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height={14}
    width={14}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g clipPath="url(#disconnect_logo_clip)">
      <path
        clipRule="evenodd"
        d="M7 .875a.656.656 0 0 1 .656.656V7.22a.656.656 0 1 1-1.312 0V1.53A.656.656 0 0 1 7 .875ZM3.596 2.669a.656.656 0 0 1 0 .927 4.813 4.813 0 1 0 6.808 0 .656.656 0 0 1 .927-.927 6.125 6.125 0 1 1-8.662 0 .656.656 0 0 1 .927 0Z"
        fill="#A3A3A3"
        fillRule="evenodd"
      />
    </g>
    <defs>
      <clipPath id="disconnect_logo_clip">
        <path d="M0 0h14v14H0z" fill="#fff" />
      </clipPath>
    </defs>
  </svg>
)
