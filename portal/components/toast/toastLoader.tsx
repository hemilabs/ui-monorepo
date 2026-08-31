import Skeleton from 'react-loading-skeleton'

type Variant = 'default' | 'withGoTo'

const heightClassName: Record<Variant, string> = {
  default: 'h-16',
  withGoTo: 'h-24.5',
}

type Props = {
  variant?: Variant
}

export const ToastLoader = ({ variant = 'default' }: Props) => (
  <Skeleton
    className={`w-full rounded-lg md:w-96 ${heightClassName[variant]}`}
    containerClassName="fixed bottom-20 inset-x-4 z-40 md:bottom-auto md:left-auto md:right-8 md:top-20"
  />
)
