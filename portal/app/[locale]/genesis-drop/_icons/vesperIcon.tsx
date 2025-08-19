import { ComponentProps } from 'react'

export const VesperIcon = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height={16}
    width={16}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect fill="#F5F5F5" height={16} rx={3} width={16} />
    <path
      d="M10.93 3.495 8.894 9.783 6.857 3.495H3l.6 1.702H5.39l2.58 7.307h1.85L13 3.495h-2.07Z"
      fill="#171717"
    />
  </svg>
)
