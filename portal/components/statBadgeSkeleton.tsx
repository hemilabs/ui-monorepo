import Skeleton from 'react-loading-skeleton'

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
}) => <Skeleton className={`h-4.5 ${skeletonWidths[size]}`} />
