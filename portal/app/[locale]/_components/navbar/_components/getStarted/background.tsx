import { ComponentProps } from 'react'

export const Background = (props: ComponentProps<'svg'>) => (
  <svg
    className="size-full"
    fill="none"
    viewBox="0 0 210 120"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs>
      <path
        d="M303.142 47.627H192.149c-17.777 0-32.188-14.41-32.188-32.188V-88.446"
        id="getStartedPath1"
      />
      <path
        d="M295.219 55.595H190.001c-21.06 0-38.133-17.073-38.134-38.133v-97.94"
        id="getStartedPath2"
      />
    </defs>
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

    {/* Animated circles - only visible on group hover */}
    <circle
      className="opacity-0 transition-opacity duration-300 group-hover/item:opacity-100"
      fill="#fff"
      r="3"
    >
      <animateMotion
        dur="8s"
        keyPoints="1;0"
        keyTimes="0;1"
        repeatCount="indefinite"
      >
        <mpath href="#getStartedPath1" />
      </animateMotion>
    </circle>
    <circle
      className="opacity-0 transition-opacity duration-300 group-hover/item:opacity-100"
      fill="#fff"
      r="3"
    >
      <animateMotion
        begin="1s"
        dur="6s"
        keyPoints="1;0"
        keyTimes="0;1"
        repeatCount="indefinite"
      >
        <mpath href="#getStartedPath2" />
      </animateMotion>
    </circle>
  </svg>
)
