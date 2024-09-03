import { ComponentProps } from 'react'

export const TunnelIcon = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height={14}
    width={14}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M1.568 4.76a.525.525 0 0 0 .742-.028l1.365-1.47v6.013a.525.525 0 1 0 1.05 0V3.262l1.365 1.47a.525.525 0 1 0 .77-.714l-2.275-2.45a.525.525 0 0 0-.77 0L1.54 4.018a.525.525 0 0 0 .028.742Zm5.6 4.48a.525.525 0 0 0-.028.742l2.275 2.45a.525.525 0 0 0 .77 0l2.275-2.45a.525.525 0 0 0-.77-.714l-1.364 1.47V4.726a.525.525 0 0 0-1.05 0v6.014L7.91 9.268a.525.525 0 0 0-.742-.029Z"
      fill="#A3A3A3"
      fillRule="evenodd"
    />
  </svg>
)
