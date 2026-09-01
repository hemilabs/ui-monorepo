import Skeleton from 'react-loading-skeleton'

const heights = {
  default: 'h-16',
  withCallToAction: 'h-24.5',
} as const

type Props = {
  variant?: keyof typeof heights
}

export const ToastLoader = ({ variant = 'default' }: Props) => (
  <Skeleton
    className={`w-full rounded-lg md:w-96 ${heights[variant]}`}
    containerClassName="toast-position"
  />
)
