import { ComponentProps } from 'react'

export const ExclamationMark = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height={32}
    viewBox="0 0 32 32"
    width={32}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect fill="#FFF6ED" height="31" rx="15.5" width="31" x="0.5" y="0.5" />
    <rect height="31" rx="15.5" stroke="#FFEBD4" width="31" x="0.5" y="0.5" />
    <g filter="url(#filter0_i_6648_148365)">
      <path
        d="M16 13.5V16.625M23.5 16C23.5 16.9849 23.306 17.9602 22.9291 18.8701C22.5522 19.7801 21.9997 20.6069 21.3033 21.3033C20.6069 21.9997 19.7801 22.5522 18.8701 22.9291C17.9602 23.306 16.9849 23.5 16 23.5C15.0151 23.5 14.0398 23.306 13.1299 22.9291C12.2199 22.5522 11.3931 21.9997 10.6967 21.3033C10.0003 20.6069 9.44781 19.7801 9.0709 18.8701C8.69399 17.9602 8.5 16.9849 8.5 16C8.5 14.0109 9.29018 12.1032 10.6967 10.6967C12.1032 9.29018 14.0109 8.5 16 8.5C17.9891 8.5 19.8968 9.29018 21.3033 10.6967C22.7098 12.1032 23.5 14.0109 23.5 16ZM16 19.125H16.0067V19.1317H16V19.125Z"
        stroke="#FF6C15"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </g>
    <defs>
      <filter
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
        height="16.5"
        id="filter0_i_6648_148365"
        width="16.5"
        x="7.75"
        y="7.75"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend
          in="SourceGraphic"
          in2="BackgroundImageFix"
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
        <feGaussianBlur stdDeviation="0.416667" />
        <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.270588 0 0 0 0 0.0666667 0 0 0 0 0.0196078 0 0 0 0.24 0"
        />
        <feBlend
          in2="shape"
          mode="normal"
          result="effect1_innerShadow_6648_148365"
        />
      </filter>
    </defs>
  </svg>
)
