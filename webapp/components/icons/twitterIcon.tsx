import { ComponentProps } from 'react'

export const TwitterIcon = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height={16}
    width={16}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g clipPath="url(#x_icon_clippath)">
      <path
        d="M12.6.769h2.454l-5.36 6.126L16 15.231h-4.937l-3.867-5.056-4.425 5.056H.316l5.733-6.554L0 .77h5.063l3.495 4.622L12.601.769Zm-.86 12.994h1.36L4.323 2.16H2.865l8.875 11.603Z"
        fill="#737373"
      />
    </g>
    <defs>
      <clipPath id="x_icon_clippath">
        <path d="M0 0h16v16H0z" fill="#fff" />
      </clipPath>
    </defs>
  </svg>
)
