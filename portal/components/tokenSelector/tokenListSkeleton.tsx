import Skeleton from 'react-loading-skeleton'

export const TokenListSkeleton = () => (
  <ul className="space-y-2">
    {Array.from({ length: 10 }).map((_, idx) => (
      <li className="flex items-center gap-x-3" key={idx}>
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex flex-1 flex-col gap-y-2">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
        <Skeleton className="h-4 w-10 rounded" />
      </li>
    ))}
  </ul>
)
