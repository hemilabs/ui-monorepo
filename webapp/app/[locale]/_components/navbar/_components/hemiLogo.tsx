import { ComponentProps } from 'react'

export const HemiLogo = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height={20}
    width={20}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect fill="#FF6C15" height={20} rx={5} width={20} />
    <rect
      height={19}
      rx={4.5}
      stroke="#C73807"
      strokeOpacity={0.56}
      width={19}
      x={0.5}
      y={0.5}
    />
    <g filter="url(#filter0_i_6168_15988)">
      <path
        d="M11.346 3.002a.13.13 0 0 0-.153.108l-.869 5.02h-.648l-.87-5.02a.13.13 0 0 0-.152-.108c-3.085.609-5.45 3.284-5.646 6.556 0 .004-.008.142-.008.211v.229c0 3.47 2.433 6.357 5.658 6.996a.13.13 0 0 0 .153-.108l.869-5.02h.649l.864 5.024a.13.13 0 0 0 .153.108c3.085-.613 5.446-3.289 5.645-6.56 0-.004.009-.142.009-.211v-.23c.004-3.469-2.429-6.356-5.654-6.995Z"
        fill="#fff"
      />
    </g>
    <defs>
      <filter
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
        height={14}
        id="filter0_i_6168_15988"
        width={14}
        x={3}
        y={3}
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feColorMatrix
          in="SourceAlpha"
          result="hardAlpha"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        />
        <feOffset />
        <feGaussianBlur stdDeviation={0.5} />
        <feComposite in2="hardAlpha" k2={-1} k3={1} operator="arithmetic" />
        <feColorMatrix values="0 0 0 0 0.270588 0 0 0 0 0.0666667 0 0 0 0 0.0196078 0 0 0 0.24 0" />
        <feBlend in2="shape" result="effect1_innerShadow_6168_15988" />
      </filter>
    </defs>
  </svg>
)
