import { TunnelHistoryContext } from 'app/context/tunnelHistoryContext'
import { useTranslations } from 'next-intl'
import { useContext } from 'react'
import { useAccount } from 'wagmi'

const Spinner = () => (
  <svg
    className="absolute left-1 top-1 h-[calc(100%-0.5rem)] w-[calc(100%-0.5rem)]"
    color="#F16063"
    fill="none"
    height="32"
    preserveAspectRatio="xMidYMid"
    viewBox="0 0 200 200"
    width="32"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="spinner-secondHalf">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
        <stop offset="100%" stopColor="#FF6C15" stopOpacity="0.3" />
      </linearGradient>
      <linearGradient id="spinner-firstHalf">
        <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
        <stop offset="100%" stopColor="#C73807" stopOpacity="0.3" />
      </linearGradient>
    </defs>
    <g strokeWidth="8">
      <path
        d="M 4 100 A 96 96 0 0 1 196 100"
        stroke="url(#spinner-secondHalf)"
      />
      <path
        d="M 196 100 A 96 96 0 0 1 4 100"
        stroke="url(#spinner-firstHalf)"
      />

      <path
        d="M 4 100 A 96 96 0 0 1 4 98"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </g>
    <animateTransform
      attributeName="transform"
      dur="1300ms"
      from="0 0 0"
      repeatCount="indefinite"
      to="360 0 0"
      type="rotate"
    />
  </svg>
)

export const TunnelHistorySyncStatus = function () {
  const { isConnected } = useAccount()
  const { depositSyncStatus } = useContext(TunnelHistoryContext)
  const t = useTranslations('transaction-history')
  if (depositSyncStatus !== 'syncing' || !isConnected) {
    return <div />
  }
  return (
    <div className="flex items-center gap-x-2 lg:mr-auto">
      <div className="relative h-6 w-6 rounded-full border border-slate-300/50 bg-white">
        <Spinner />
      </div>
      <span className="ml-px text-xs font-medium text-slate-500">
        {t('loading-transactions')}
      </span>
    </div>
  )
}
