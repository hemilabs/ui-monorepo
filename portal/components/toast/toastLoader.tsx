import Skeleton from 'react-loading-skeleton'

export const ToastLoader = ({ className }: { className: string }) => (
  <Skeleton
    className={`w-full rounded-lg md:w-96 ${className}`}
    containerClassName="fixed bottom-20 inset-x-4 z-40 md:bottom-auto md:left-auto md:right-8 md:top-20"
  />
)
