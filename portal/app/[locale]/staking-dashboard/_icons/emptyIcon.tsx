import { ComponentProps } from 'react'
import { orange600 } from 'styles'

export const EmptyIcon = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height="20"
    width="20"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g filter="url(#a_emptyIcon12487)">
      <path
        d="M16.749 7.998a2.251 2.251 0 0 1 2.25 2.25v5.5a2.25 2.25 0 0 1-2.25 2.25h-13.5a2.25 2.25 0 0 1-2.25-2.25v-5.5a2.25 2.25 0 0 1 2.25-2.25h13.5Zm-6.62 2.147a.348.348 0 0 0-.32.214l-.653 1.57-1.694.135a.347.347 0 0 0-.197.61l1.29 1.105-.394 1.653a.347.347 0 0 0 .518.376l1.45-.885 1.451.885a.349.349 0 0 0 .385-.015.346.346 0 0 0 .134-.362l-.395-1.653 1.291-1.105a.347.347 0 0 0-.198-.61l-1.695-.135-.652-1.569a.348.348 0 0 0-.32-.214Zm4.62-5.147c.98 0 1.814.627 2.123 1.502a3.828 3.828 0 0 0-.123-.002h-13.5c-.04 0-.082 0-.123.002a2.25 2.25 0 0 1 2.123-1.502h9.5Zm-2-3A2.252 2.252 0 0 1 14.872 3.5c-.04-.002-.082-.002-.123-.002h-9.5l-.123.002a2.25 2.25 0 0 1 2.123-1.502h5.5Z"
        fill={orange600}
      />
    </g>
    <defs>
      <filter
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
        height={16}
        id="a_emptyIcon12487"
        width={18}
        x={0.999}
        y={1.998}
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
        <feBlend in2="shape" result="effect1_innerShadow_14373_33361" />
      </filter>
    </defs>
  </svg>
)
