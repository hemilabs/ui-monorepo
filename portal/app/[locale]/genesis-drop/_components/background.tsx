import { ComponentProps } from 'react'

const LeftBackground = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height={868}
    width={235}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs>
      <path
        d="m-307.317-103.999 375.43 377.146c70.284 70.605 70.023 184.816-.582 255.101L-33.197 634.503"
        id="leftPath1"
      />
      <path
        d="m-246.159 971.012 392.421-392.418c62.852-62.851 62.852-164.754 0-227.605L-221.03-16.301"
        id="leftPath2"
      />
      <path
        d="m-204.116 971.613 372.003-372c74.457-74.461 74.457-195.184 0-269.645L-178.386-16.301"
        id="leftPath3"
      />
    </defs>
    <path
      d="m-307.317-103.999 375.43 377.146c70.284 70.605 70.023 184.816-.582 255.101L-33.197 634.503"
      stroke="#E9F8F9"
      strokeLinecap="round"
      strokeWidth={22}
    />
    <path
      d="m-246.159 971.012 392.421-392.418c62.852-62.851 62.852-164.754 0-227.605L-221.03-16.301"
      stroke="#FF6A00"
      strokeLinecap="round"
      strokeWidth={22}
    />
    <path
      d="m-204.116 971.613 372.003-372c74.457-74.461 74.457-195.184 0-269.645L-178.386-16.301"
      stroke="#009CF5"
      strokeLinecap="round"
      strokeWidth={22}
    />

    {/* Animated circles following the paths */}
    <circle fill="#fff" r="8.469">
      <animateMotion dur="8s" repeatCount="indefinite">
        <mpath href="#leftPath1" />
      </animateMotion>
    </circle>
    <circle fill="#fff" r="8.469">
      <animateMotion begin="1s" dur="6s" repeatCount="indefinite">
        <mpath href="#leftPath2" />
      </animateMotion>
    </circle>
    <circle fill="#fff" r="8.469">
      <animateMotion begin="2s" dur="7s" repeatCount="indefinite">
        <mpath href="#leftPath3" />
      </animateMotion>
    </circle>
  </svg>
)
const RightBackground = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height={868}
    width={234}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs>
      <path
        d="M542.046-103.999 166.617 273.147c-70.284 70.605-70.024 184.816.582 255.101l100.727 106.255"
        id="rightPath1"
      />
      <path
        d="M480.889 971.011 88.468 578.593c-62.852-62.851-62.852-164.754 0-227.605L455.76-16.302"
        id="rightPath2"
      />
      <path
        d="m438.846 971.612-372.003-372c-74.457-74.461-74.457-195.184 0-269.645L413.116-16.302"
        id="rightPath3"
      />
    </defs>
    <path
      d="M542.046-103.999 166.617 273.147c-70.284 70.605-70.024 184.816.582 255.101l100.727 106.255"
      stroke="#E9F8F9"
      strokeLinecap="round"
      strokeWidth={22}
    />
    <path
      d="M480.889 971.011 88.468 578.593c-62.852-62.851-62.852-164.754 0-227.605L455.76-16.302"
      stroke="#1B282F"
      strokeLinecap="round"
      strokeWidth={22}
    />
    <path
      d="m438.846 971.612-372.003-372c-74.457-74.461-74.457-195.184 0-269.645L413.116-16.302"
      stroke="#FF6A00"
      strokeLinecap="round"
      strokeWidth={22}
    />

    {/* Animated circles following the paths */}
    <circle fill="#fff" r="8.469">
      <animateMotion begin="0.5s" dur="8s" repeatCount="indefinite">
        <mpath href="#rightPath1" />
      </animateMotion>
    </circle>
    <circle fill="#fff" r="8.469">
      <animateMotion begin="1.5s" dur="6s" repeatCount="indefinite">
        <mpath href="#rightPath2" />
      </animateMotion>
    </circle>
    <circle fill="#fff" r="8.469">
      <animateMotion begin="2.5s" dur="7s" repeatCount="indefinite">
        <mpath href="#rightPath3" />
      </animateMotion>
    </circle>
  </svg>
)

export const Background = () => (
  <>
    <LeftBackground className="xs:-left-30 absolute -left-44 -top-24 bottom-12 -z-10 md:left-0" />
    <RightBackground className="xs:-right-30 absolute -right-44 -top-24 bottom-12 -z-10 md:right-0" />
  </>
)
