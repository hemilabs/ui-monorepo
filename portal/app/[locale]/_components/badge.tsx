import { useNetworkType } from 'hooks/useNetworkType'
import { Suspense } from 'react'

const BadgeImpl = function () {
  const [networkType] = useNetworkType()
  return (
    <span
      className="text-xxs bg-sky-450 h-4.5 flex items-center justify-center rounded-md
    px-1.5 text-center font-medium capitalize text-white"
      style={{
        boxShadow:
          '0px 1px 0px 0px rgba(255, 255, 255, 0.25) inset, 0px 1px 2px 0px rgba(10, 10, 10, 0.04)',
      }}
    >
      {networkType}
    </span>
  )
}

export const Badge = () => (
  <Suspense>
    <BadgeImpl />
  </Suspense>
)
