import { ComponentProps } from 'react'

export const ToolsIcon = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height={14}
    width={14}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g clipPath="url(#tools_clip_path)" fill="#A3A3A3">
      <path
        clipRule="evenodd"
        d="M10.15 7a3.15 3.15 0 0 0 2.999-4.118c-.074-.227-.357-.274-.526-.105l-1.885 1.884a.318.318 0 0 1-.345.077 2.107 2.107 0 0 1-1.133-1.13.318.318 0 0 1 .077-.347l1.886-1.884c.168-.169.122-.453-.105-.526a3.15 3.15 0 0 0-4.11 3.202c.038.611-.09 1.266-.56 1.658L1.385 9.927a1.908 1.908 0 1 0 2.686 2.686l4.217-5.06c.392-.471 1.046-.6 1.657-.56a2.8 2.8 0 0 0 .204.006ZM3.5 11.2a.7.7 0 1 1-1.4 0 .7.7 0 0 1 1.4 0Z"
        fillRule="evenodd"
      />
      <path d="M10.15 8.05c.121 0 .242-.005.36-.016l2.628 2.628a1.75 1.75 0 1 1-2.476 2.475L7.575 10.05l1.52-1.825a.466.466 0 0 1 .24-.137c.142-.042.329-.06.544-.047.09.006.18.009.271.009ZM4.2 3.21l1.631 1.63a.317.317 0 0 1-.056.064l-1.015.845L3.21 4.2h-.894a.35.35 0 0 1-.313-.193L.813 1.625A.35.35 0 0 1 .88 1.22l.343-.343a.35.35 0 0 1 .403-.066l2.382 1.19a.35.35 0 0 1 .193.315v.893Z" />
    </g>
    <defs>
      <clipPath id="tools_clip_path">
        <path d="M0 0h14v14H0z" fill="#fff" />
      </clipPath>
    </defs>
  </svg>
)