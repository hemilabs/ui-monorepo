import Skeleton from 'react-loading-skeleton'

export const TokenListSkeleton = () => (
  <ul className="space-y-6">
    {Array.from({ length: 10 }).map((_, idx) => (
      <li className="flex items-end gap-x-3" key={idx}>
        <Skeleton className="size-8 rounded-full" />
        <div className="flex flex-1 flex-col justify-center leading-none">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
        <div className="flex flex-col items-end justify-center leading-none">
          <Skeleton className="h-3 w-12 rounded" />
          <Skeleton className="h-3 w-10 rounded" />
        </div>
      </li>
    ))}
  </ul>
)
