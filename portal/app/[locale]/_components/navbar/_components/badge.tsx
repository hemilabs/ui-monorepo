import { useNetworkType } from 'hooks/useNetworkType'

export const Badge = function () {
  const [networkType] = useNetworkType()
  return (
    <span
      className="text-xxs flex h-5 items-center justify-center rounded-md
    px-1.5 py-1 text-center font-medium capitalize text-orange-950"
      style={{
        background:
          'linear-gradient(180deg, rgba(255, 255, 255, 0.20) 35.57%, rgba(255, 255, 255, 0.00) 70.92%), var(--Color-Orange-500, #FF6C15)',
        boxShadow:
          '0px 1px 0px 0px rgba(255, 255, 255, 0.25) inset, 0px 1px 2px 0px rgba(10, 10, 10, 0.04)',
        textShadow:
          '0px 0px 2px rgba(255, 255, 255, 0.56), 0px 0px 1px rgba(0, 0, 0, 0.14)',
      }}
    >
      {networkType}
    </span>
  )
}
