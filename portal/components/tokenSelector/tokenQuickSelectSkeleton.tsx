import Skeleton from 'react-loading-skeleton'

import { maxQuickSelectionTokens } from './utils'

export const TokenQuickSelectSkeleton = () => (
  <div className="grid grid-cols-3 gap-x-3">
    {Array.from({ length: maxQuickSelectionTokens }).map((_, idx) => (
      <div
        className="flex flex-col items-center gap-y-1 rounded-lg bg-white pb-2 pt-4 shadow-sm"
        key={idx}
      >
        <div className="flex size-5 scale-125 items-center leading-none">
          <Skeleton className="size-5 rounded-full" />
        </div>
        <div className="flex h-4.5 items-center leading-none">
          <Skeleton className="h-3 w-10 rounded" />
        </div>
      </div>
    ))}
  </div>
)
