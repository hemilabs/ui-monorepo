import { ComponentProps } from 'react'

const coin =
  'M5.25 0C4.56056 -1.02735e-08 3.87787 0.135795 3.24091 0.399632C2.60395 0.66347 2.0252 1.05018 1.53769 1.53769C1.05018 2.0252 0.66347 2.60395 0.399632 3.24091C0.135795 3.87787 0 4.56056 0 5.25C0 5.93944 0.135795 6.62213 0.399632 7.25909C0.66347 7.89605 1.05018 8.4748 1.53769 8.96231C2.0252 9.44982 2.60395 9.83653 3.24091 10.1004C3.87787 10.3642 4.56056 10.5 5.25 10.5C6.64239 10.5 7.97774 9.94688 8.96231 8.96231C9.94688 7.97774 10.5 6.64239 10.5 5.25C10.5 3.85761 9.94688 2.52226 8.96231 1.53769C7.97774 0.553123 6.64239 2.07482e-08 5.25 0ZM5.25 1.575L8.575 4.9H6.7375V8.925H3.7625V4.9H1.925L5.25 1.575Z'

const sparkle =
  'M5.5 0C6.05 3.11667 7.88333 4.95 11 5.5C7.88333 6.05 6.05 7.88333 5.5 11C4.95 7.88333 3.11667 6.05 0 5.5C3.11667 4.95 4.95 3.11667 5.5 0Z'

type Props = ComponentProps<'svg'> & { selected?: boolean }

export const HemiStakeIcon = ({ selected = false, ...props }: Props) => (
  <svg
    className="size-full overflow-visible"
    fill="none"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g transform="translate(3 3) scale(1.3333)">
      <path
        className={
          selected
            ? 'fill-orange-600'
            : 'fill-neutral-400 group-hover/item:fill-neutral-950'
        }
        clipRule="evenodd"
        d={coin}
        fillRule="evenodd"
      />
    </g>
    <g transform="translate(13 -4)">
      <path
        className={selected ? 'fill-orange-400' : 'fill-orange-600'}
        d={sparkle}
      />
    </g>
    <g transform="translate(-5 14) scale(0.6364)">
      <path
        className={selected ? 'fill-orange-300' : 'fill-orange-500'}
        d={sparkle}
      />
    </g>
    <g transform="translate(16 19) scale(0.4545)">
      <path
        className={selected ? 'fill-orange-300' : 'fill-orange-400'}
        d={sparkle}
      />
    </g>
  </svg>
)
