export const EthLogo = () => (
  <svg fill="none" height={38} width={38} xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#svg_eth_logo_id_a)">
      <rect fill="#fff" height={32} rx={16} width={32} x={3} y={2} />
      <rect
        height={31.3}
        rx={15.65}
        stroke="#B2B3B3"
        strokeOpacity={0.56}
        strokeWidth={0.7}
        width={31.3}
        x={3.35}
        y={2.35}
      />
      <g filter="url(#svg_eth_logo_id_b)">
        <rect
          fill="#6B8AFF"
          fillOpacity={0.2}
          height={28}
          rx={14}
          width={28}
          x={5}
          y={4}
        />
        <rect
          height={27.5}
          rx={13.75}
          stroke="#6B8AFF"
          strokeOpacity={0.4}
          strokeWidth={0.5}
          width={27.5}
          x={5.25}
          y={4.25}
        />
        <path
          d="m18.482 10.29-4.395 7.226a.597.597 0 0 0 .21.826l4.395 2.574c.19.112.426.112.616 0l4.395-2.574c.289-.17.384-.54.21-.826l-4.394-7.226a.609.609 0 0 0-1.037 0Z"
          fill="#6B8AFF"
        />
        <path
          d="m22.79 21.01-.003-.031-.006-.03c-.002-.013-.006-.024-.01-.036a.31.31 0 0 0-.03-.064l-.013-.02a.344.344 0 0 0-.096-.097c-.007-.005-.014-.007-.02-.012a.298.298 0 0 0-.039-.02l-.027-.01a.404.404 0 0 0-.098-.02h-.035c-.008 0-.017.003-.026.004-.013.001-.026.002-.04.005-.003 0-.007.003-.01.004a.372.372 0 0 0-.114.049l-2.892 1.704a.651.651 0 0 1-.662 0l-2.892-1.704a.372.372 0 0 0-.114-.05l-.01-.003a1.155 1.155 0 0 0-.065-.008h-.036l-.032.003-.03.005-.036.01-.027.01a.292.292 0 0 0-.038.021c-.007.004-.014.007-.02.012a.34.34 0 0 0-.097.096l-.012.02c-.008.014-.015.026-.02.039-.005.008-.007.018-.011.026l-.01.035a.177.177 0 0 0-.006.03.176.176 0 0 0-.003.032v.035l.003.027c.002.013.003.026.006.038 0 .005.003.01.004.015.012.043.03.083.057.12l3.188 4.482a.652.652 0 0 0 1.062 0l3.188-4.483a.354.354 0 0 0 .057-.12c0-.004.004-.01.004-.014l.006-.038c0-.01.002-.018.003-.027v-.035h.002Z"
          fill="#6B8AFF"
        />
      </g>
    </g>
    <defs>
      <filter
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
        height={38}
        id="svg_eth_logo_id_a"
        width={38}
        x={0}
        y={0}
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          result="hardAlpha"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        />
        <feOffset dy={1} />
        <feGaussianBlur stdDeviation={1.5} />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix values="0 0 0 0 0.419608 0 0 0 0 0.541176 0 0 0 0 1 0 0 0 0.16 0" />
        <feBlend
          in2="BackgroundImageFix"
          result="effect1_dropShadow_2243_68212"
        />
        <feBlend
          in="SourceGraphic"
          in2="effect1_dropShadow_2243_68212"
          result="shape"
        />
      </filter>
      <filter
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
        height={28}
        id="svg_eth_logo_id_b"
        width={28}
        x={5}
        y={4}
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feColorMatrix
          in="SourceAlpha"
          result="hardAlpha"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        />
        <feOffset />
        <feGaussianBlur stdDeviation={1} />
        <feComposite in2="hardAlpha" k2={-1} k3={1} operator="arithmetic" />
        <feColorMatrix values="0 0 0 0 0.419608 0 0 0 0 0.541176 0 0 0 0 1 0 0 0 0.48 0" />
        <feBlend in2="shape" result="effect1_innerShadow_2243_68212" />
      </filter>
    </defs>
  </svg>
)
