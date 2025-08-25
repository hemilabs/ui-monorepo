import { ComponentProps } from 'react'

export const Background = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height="120"
    width="212"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect
      className="transition-colors duration-300"
      fill="transparent"
      height="100%"
      rx="8"
      width="100%"
    />
    <path
      d="M303.142 47.627H192.149c-17.777 0-32.188-14.41-32.188-32.188V-88.446"
      stroke="#FF6A00"
      strokeLinecap="round"
      strokeWidth="6"
    />
    <path
      d="M295.219 55.595H190.001c-21.06 0-38.133-17.073-38.134-38.133v-97.94"
      stroke="#009CF5"
      strokeLinecap="round"
      strokeWidth="6"
    />
  </svg>
)
