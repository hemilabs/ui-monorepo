import { ComponentProps } from 'react'

type Props = ComponentProps<'svg'> & { selected?: boolean }

export const HemiStakeIcon = ({
  className = '',
  selected = false,
  ...props
}: Props) => (
  <svg
    className={`overflow-visible ${className}`}
    fill="none"
    viewBox="0 0 10.5 10.5"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      className={
        selected
          ? 'fill-orange-600'
          : 'fill-neutral-400 group-hover/item:fill-neutral-950'
      }
      clipRule="evenodd"
      d="M5.25 0C4.56056 -1.02735e-08 3.87787 0.135795 3.24091 0.399632C2.60395 0.66347 2.0252 1.05018 1.53769 1.53769C1.05018 2.0252 0.66347 2.60395 0.399632 3.24091C0.135795 3.87787 0 4.56056 0 5.25C0 5.93944 0.135795 6.62213 0.399632 7.25909C0.66347 7.89605 1.05018 8.4748 1.53769 8.96231C2.0252 9.44982 2.60395 9.83653 3.24091 10.1004C3.87787 10.3642 4.56056 10.5 5.25 10.5C6.64239 10.5 7.97774 9.94688 8.96231 8.96231C9.94688 7.97774 10.5 6.64239 10.5 5.25C10.5 3.85761 9.94688 2.52226 8.96231 1.53769C7.97774 0.553123 6.64239 2.07482e-08 5.25 0ZM5.25 1.575L8.575 4.9H6.7375V8.925H3.7625V4.9H1.925L5.25 1.575Z"
      fillRule="evenodd"
    />
    <path
      className={selected ? 'fill-orange-400' : 'fill-orange-600'}
      d="M11.62 -5.25C12.04 -2.91 13.41 -1.54 15.75 -1.12C13.41 -0.71 12.04 0.66 11.62 3C11.21 0.66 9.84 -0.71 7.5 -1.12C9.84 -1.54 11.21 -2.91 11.62 -5.25Z"
    />
    <path
      className={selected ? 'fill-orange-300' : 'fill-orange-500'}
      d="M-3.38 8.25C-3.11 9.74 -2.24 10.61 -0.75 10.88C-2.24 11.14 -3.11 12.01 -3.38 13.5C-3.64 12.01 -4.51 11.14 -6 10.88C-4.51 10.61 -3.64 9.74 -3.38 8.25Z"
    />
    <path
      className={selected ? 'fill-orange-300' : 'fill-orange-400'}
      d="M11.62 12C11.81 13.06 12.44 13.69 13.5 13.88C12.44 14.06 11.81 14.69 11.62 15.75C11.44 14.69 10.81 14.06 9.75 13.88C10.81 13.69 11.44 13.06 11.62 12Z"
    />
  </svg>
)
