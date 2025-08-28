export const LiveIcon = () => (
  <svg
    className="mb-1"
    fill="none"
    height={32}
    width={32}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect fill="#FFF6ED" height={32} rx={16} width={32} />
    <g filter="url(#filter0_i_14227_26767)">
      <path
        d="M17.983 7.907a.75.75 0 0 0-1.292-.657l-8.5 9.5A.75.75 0 0 0 8.75 18h6.572l-1.305 6.093a.75.75 0 0 0 1.292.657l8.5-9.5A.75.75 0 0 0 23.25 14h-6.572l1.305-6.093Z"
        fill="#FF6C15"
      />
    </g>
    <defs>
      <filter
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
        height={17.999}
        id="filter0_i_14227_26767"
        width={16}
        x={8}
        y={7.001}
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
        <feBlend in2="shape" result="effect1_innerShadow_14227_26767" />
      </filter>
    </defs>
  </svg>
)
