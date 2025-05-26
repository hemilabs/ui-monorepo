type Props = {
  value: string
}

export const Amount = ({ value }: Props) => (
  <svg fill="none" height={36} width={91} xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_ddi_12019_1876)">
      <text
        fill="#202020"
        fontFamily="Inter Display"
        fontSize="24"
        letterSpacing="-0.02em"
        style={{ whiteSpace: 'pre' }}
        xmlSpace="preserve"
      >
        <tspan x="5" y="23.7305">
          {value}
        </tspan>
      </text>
      <text
        fill="url(#paint0_linear_12019_1876)"
        fontFamily="Inter Display"
        fontSize="24"
        letterSpacing="-0.02em"
        style={{ whiteSpace: 'pre' }}
        xmlSpace="preserve"
      >
        <tspan x="5" y="23.7305">
          {value}
        </tspan>
      </text>
      <text
        fontFamily="Inter Display"
        fontSize="24"
        letterSpacing="-0.02em"
        stroke="url(#paint1_linear_12019_1876)"
        strokeWidth="0.4"
        style={{ whiteSpace: 'pre' }}
        xmlSpace="preserve"
      >
        <tspan x="5" y="23.7305">
          {value}
        </tspan>
      </text>
    </g>
    <defs>
      <filter
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
        height="34.6406"
        id="filter0_ddi_12019_1876"
        width="89.3807"
        x="0.855469"
        y="0.949219"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          result="hardAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        />
        <feOffset dx="1" dy="3" />
        <feGaussianBlur stdDeviation="3" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.32 0"
        />
        <feBlend
          in2="BackgroundImageFix"
          mode="normal"
          result="effect1_dropShadow_12019_1876"
        />
        <feColorMatrix
          in="SourceAlpha"
          result="hardAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        />
        <feOffset dx="1" dy="1" />
        <feGaussianBlur stdDeviation="1" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.24 0"
        />
        <feBlend
          in2="effect1_dropShadow_12019_1876"
          mode="normal"
          result="effect2_dropShadow_12019_1876"
        />
        <feBlend
          in="SourceGraphic"
          in2="effect2_dropShadow_12019_1876"
          mode="normal"
          result="shape"
        />
        <feColorMatrix
          in="SourceAlpha"
          result="hardAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        />
        <feOffset />
        <feGaussianBlur stdDeviation="1.5" />
        <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.32 0"
        />
        <feBlend
          in2="shape"
          mode="normal"
          result="effect3_innerShadow_12019_1876"
        />
      </filter>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id="paint0_linear_12019_1876"
        x1="95"
        x2="95"
        y1="3"
        y2="24"
      >
        <stop offset="0.199134" stopColor="white" stopOpacity="0.32" />
        <stop offset="1" stopColor="white" stopOpacity="0.08" />
      </linearGradient>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id="paint1_linear_12019_1876"
        x1="95"
        x2="95"
        y1="3"
        y2="27"
      >
        <stop offset="0.0592213" stopColor="#D4D4D8" stopOpacity="0.56" />
        <stop offset="0.837686" stopColor="#D4D4D8" stopOpacity="0.12" />
      </linearGradient>
    </defs>
  </svg>
)
