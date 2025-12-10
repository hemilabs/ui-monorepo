import { ComponentProps } from 'react'

export const DocsIcon = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height={10}
    width={12}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M5.25.688A8.035 8.035 0 0 0 .378.165.48.48 0 0 0 0 .64v7.994c0 .345.342.588.679.512a6.02 6.02 0 0 1 4.571.81V.688Zm1.5 9.268a6.02 6.02 0 0 1 4.571-.81c.337.075.679-.167.679-.512V.64a.48.48 0 0 0-.378-.475A8.034 8.034 0 0 0 6.75.688v9.268Z"
      fill="#A3A3A3"
    />
  </svg>
)
