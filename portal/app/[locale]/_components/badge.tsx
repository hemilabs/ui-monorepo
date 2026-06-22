import { useNetworkType } from 'hooks/useNetworkType'
import { Suspense } from 'react'

const BadgeImpl = function () {
  const [networkType] = useNetworkType()
  return (
    <span className="flex h-4.5 items-center justify-center rounded-md bg-neutral-900 px-1.5 text-center text-xxs font-medium capitalize text-white">
      {networkType}
    </span>
  )
}

export const Badge = () => (
  <Suspense>
    <BadgeImpl />
  </Suspense>
)
