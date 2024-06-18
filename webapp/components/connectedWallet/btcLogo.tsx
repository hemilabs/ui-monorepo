export const BtcLogo = () => (
  <svg fill="none" height={38} width={38} xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_2265_8536)">
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
      <g filter="url(#filter1_i_2265_8536)">
        <rect
          fill="#FF6C15"
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
          stroke="#FF6C15"
          strokeOpacity={0.4}
          strokeWidth={0.5}
          width={27.5}
          x={5.25}
          y={4.25}
        />
        <path
          d="M24.969 16.386c.25-1.67-1.022-2.567-2.76-3.165l.564-2.262-1.375-.342-.55 2.202c-.361-.091-.732-.176-1.102-.26l.553-2.216L18.923 10l-.564 2.26c-.3-.068-.594-.135-.879-.207l.002-.007-1.898-.473-.367 1.47s1.022.233 1 .248c.558.14.658.508.641.8l-.641 2.576c.038.01.087.024.143.046l-.146-.036-.9 3.608c-.068.17-.24.423-.63.327.014.02-1-.25-1-.25L13 21.939l1.791.446c.333.084.66.171.98.253l-.569 2.287 1.375.343.564-2.262c.376.101.74.195 1.097.285l-.562 2.251 1.376.343.57-2.282c2.346.444 4.11.265 4.854-1.858.599-1.709-.03-2.695-1.265-3.338.9-.207 1.577-.798 1.758-2.02Zm-3.145 4.409c-.425 1.71-3.303.785-4.236.553l.756-3.03c.933.234 3.925.695 3.48 2.477Zm.425-4.434c-.387 1.555-2.782.764-3.558.57l.684-2.746c.776.193 3.279.554 2.875 2.176Z"
          fill="#FF6C15"
        />
      </g>
    </g>
    <defs>
      <filter
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
        height={38}
        id="filter0_d_2265_8536"
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
        <feColorMatrix values="0 0 0 0 1 0 0 0 0 0.423529 0 0 0 0 0.0823529 0 0 0 0.16 0" />
        <feBlend
          in2="BackgroundImageFix"
          result="effect1_dropShadow_2265_8536"
        />
        <feBlend
          in="SourceGraphic"
          in2="effect1_dropShadow_2265_8536"
          result="shape"
        />
      </filter>
      <filter
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
        height={28}
        id="filter1_i_2265_8536"
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
        <feColorMatrix values="0 0 0 0 1 0 0 0 0 0.423529 0 0 0 0 0.0823529 0 0 0 0.48 0" />
        <feBlend in2="shape" result="effect1_innerShadow_2265_8536" />
      </filter>
    </defs>
  </svg>
)
