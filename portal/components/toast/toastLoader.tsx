import Skeleton from 'react-loading-skeleton'

export const ToastLoader = () => (
  <Skeleton
    className="h-26 w-full rounded-xl md:w-96"
    containerClassName="fixed bottom-20 inset-x-4 z-40 md:bottom-auto md:left-auto md:right-8 md:top-20"
  />
)
