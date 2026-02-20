import { ComponentProps } from 'react'

export const WarningRounded = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height={32}
    viewBox="0 0 32 32"
    width={32}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect fill="#FEFCE8" height="31" rx="15.5" width="31" x="0.5" y="0.5" />
    <rect height="31" rx="15.5" stroke="#FEF9C2" width="31" x="0.5" y="0.5" />
    <g filter="url(#filter0_i_17604_23680)">
      <path
        clip-rule="evenodd"
        d="M14.3762 8.8125C15.0974 7.5625 16.9012 7.5625 17.6237 8.8125L24.1187 20.0625C24.2832 20.3475 24.3699 20.6709 24.3699 21C24.3699 21.3291 24.2832 21.6524 24.1187 21.9375C23.9541 22.2225 23.7174 22.4592 23.4324 22.6238C23.1474 22.7883 22.8241 22.875 22.4949 22.875H9.50493C9.17569 22.8752 8.85221 22.7887 8.567 22.6242C8.2818 22.4598 8.04493 22.2231 7.88023 21.938C7.71552 21.6529 7.62878 21.3295 7.62872 21.0003C7.62867 20.6711 7.71531 20.3476 7.87993 20.0625L14.3762 8.8125ZM15.9999 11C16.2486 11 16.487 11.0988 16.6628 11.2746C16.8387 11.4504 16.9374 11.6889 16.9374 11.9375V15.6875C16.9374 15.9361 16.8387 16.1746 16.6628 16.3504C16.487 16.5262 16.2486 16.625 15.9999 16.625C15.7513 16.625 15.5128 16.5262 15.337 16.3504C15.1612 16.1746 15.0624 15.9361 15.0624 15.6875V11.9375C15.0624 11.6889 15.1612 11.4504 15.337 11.2746C15.5128 11.0988 15.7513 11 15.9999 11ZM15.9999 21C16.3314 21 16.6494 20.8683 16.8838 20.6339C17.1182 20.3995 17.2499 20.0815 17.2499 19.75C17.2499 19.4185 17.1182 19.1005 16.8838 18.8661C16.6494 18.6317 16.3314 18.5 15.9999 18.5C15.6684 18.5 15.3505 18.6317 15.116 18.8661C14.8816 19.1005 14.7499 19.4185 14.7499 19.75C14.7499 20.0815 14.8816 20.3995 15.116 20.6339C15.3505 20.8683 15.6684 21 15.9999 21Z"
        fill="#EFB100"
        fill-rule="evenodd"
      />
    </g>
    <defs>
      <filter
        color-interpolation-filters="sRGB"
        filterUnits="userSpaceOnUse"
        height="15"
        id="filter0_i_17604_23680"
        width="16.7411"
        x="7.62872"
        y="7.875"
      >
        <feFlood flood-opacity="0" result="BackgroundImageFix" />
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
        <feGaussianBlur stdDeviation="0.520833" />
        <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.270588 0 0 0 0 0.0666667 0 0 0 0 0.0196078 0 0 0 0.24 0"
        />
        <feBlend
          in2="shape"
          mode="normal"
          result="effect1_innerShadow_17604_23680"
        />
      </filter>
    </defs>
  </svg>
)
