import { ComponentProps } from 'react'

export const InfoIcon = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height={12}
    width={12}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g clipPath="url(#info_icon_clip)">
      <path
        clipRule="evenodd"
        d="M11.25 6A5.25 5.25 0 1 1 .75 6a5.25 5.25 0 0 1 10.5 0Zm-4.5-2.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM5.062 6a.563.563 0 1 0 0 1.125h.563v1.313a.563.563 0 1 0 1.125 0V6.562A.563.563 0 0 0 6.187 6H5.063Z"
        fill="#A3A3A3"
        fillRule="evenodd"
      />
    </g>
    <defs>
      <clipPath id="info_icon_clip">
        <path d="M0 0h12v12H0z" fill="#fff" />
      </clipPath>
    </defs>
  </svg>
)
