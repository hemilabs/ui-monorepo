import { type ReactNode } from 'react'
import Skeleton from 'react-loading-skeleton'

export const StatBadge = ({ children }: { children: ReactNode }) => (
  <span className="flex w-fit items-center gap-x-1 rounded-md border border-solid border-neutral-200 bg-neutral-100 px-1.5 py-0.5 text-xxs font-medium text-neutral-600">
    {children}
  </span>
)

const skeletonWidths = {
  large: 'w-48',
  medium: 'w-36',
  small: 'w-32',
  xSmall: 'w-16',
} as const

export const StatBadgeSkeleton = ({
  size = 'medium',
}: {
  size?: keyof typeof skeletonWidths
}) => <Skeleton className={`h-4 ${skeletonWidths[size]}`} />
