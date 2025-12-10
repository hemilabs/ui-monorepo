import { ComponentProps } from 'react'

export const NetworkIcon = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height={14}
    width={12}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M6.372.099a.75.75 0 0 0-.744 0L.818 2.847 6 5.88l5.182-3.034L6.372.099ZM12 4.107 6.75 7.18v6.005l4.872-2.784A.75.75 0 0 0 12 9.75V4.107Zm-6.75 9.078V7.18L0 4.107V9.75c0 .27.144.518.378.65l4.872 2.785Z"
      fill="#A3A3A3"
    />
  </svg>
)
