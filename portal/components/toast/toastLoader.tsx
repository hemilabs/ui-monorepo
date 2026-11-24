import Skeleton from 'react-loading-skeleton'

export const ToastLoader = () => (
  <Skeleton
    className="h-[62px] w-full rounded-lg md:w-96"
    containerClassName="toast-position"
  />
)
