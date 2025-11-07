import { ComponentProps } from 'react'

export const LinesBackground = (props: ComponentProps<'svg'>) => (
  <svg
    className="pointer-events-none absolute bottom-0 right-0 -z-10"
    fill="none"
    height={550}
    viewBox="0 0 528 550"
    width={528}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs>
      <path d="M33.7149 601.411L570.798 64.3271" id="bgPath1" />
      <path d="M209.46 477.04L568.996 117.603" id="bgPath2" />
      <path d="M-16.5566 601.411L570.798 14.0566" id="bgPath3" />
      <path
        d="M570.933 318.44H418.183C386.186 318.44 355.501 331.146 332.874 353.773L85.2364 601.411"
        id="bgPath4"
      />
    </defs>
    <path
      d="M33.7149 601.411L570.798 64.3271"
      stroke="#FF5F00"
      strokeLinecap="round"
      strokeWidth={22}
    />
    <path
      d="M-16.5566 601.411L570.798 14.0566"
      stroke="#FF5F00"
      strokeLinecap="round"
      strokeWidth={22}
    />
    <circle fill="white" r={8.469}>
      <animateMotion
        dur="5s"
        keyPoints="1;0"
        keyTimes="0;1"
        repeatCount="indefinite"
      >
        <mpath href="#bgPath2" />
      </animateMotion>
    </circle>
    <path
      d="M209.46 477.04L568.996 117.603"
      stroke="#1D2E34"
      strokeLinecap="round"
      strokeWidth={22}
    />
    <path
      d="M570.933 318.44H418.183C386.186 318.44 355.501 331.146 332.874 353.773L85.2364 601.411"
      stroke="#2599EE"
      strokeLinecap="round"
      strokeWidth={22}
    />
    <circle fill="white" r={8.469}>
      <animateMotion
        begin="2s"
        dur="6s"
        keyPoints="1;0"
        keyTimes="0;1"
        repeatCount="indefinite"
      >
        <mpath href="#bgPath1" />
      </animateMotion>
    </circle>
    <circle fill="white" r={8.469}>
      <animateMotion
        begin="2s"
        dur="6s"
        keyPoints="1;0"
        keyTimes="0;1"
        repeatCount="indefinite"
      >
        <mpath href="#bgPath3" />
      </animateMotion>
    </circle>
    <circle fill="white" r={8.469}>
      <animateMotion
        begin="3s"
        dur="6s"
        keyPoints="1;0"
        keyTimes="0;1"
        repeatCount="indefinite"
      >
        <mpath href="#bgPath2" />
      </animateMotion>
    </circle>
    <circle fill="white" r={8.469}>
      <animateMotion
        begin="3s"
        dur="6s"
        keyPoints="1;0"
        keyTimes="0;1"
        repeatCount="indefinite"
      >
        <mpath href="#bgPath4" />
      </animateMotion>
    </circle>
  </svg>
)
