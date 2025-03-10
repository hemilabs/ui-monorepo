import Spinner from 'components/Spinner'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useTranslations } from 'next-intl'
import { useAccount } from 'wagmi'

export const TunnelHistorySyncStatus = function () {
  const { isConnected } = useAccount()
  const { syncStatus } = useTunnelHistory()
  const t = useTranslations('transaction-history')

  const hide = syncStatus !== 'syncing' || !isConnected

  return (
    <div
      className={`flex items-center gap-x-1 ${hide ? 'invisible' : 'block'}`}
    >
      <Spinner color="#FF6C15" size={15} />
      <span className="text-neutral-600">{t('loading-transactions')}</span>
    </div>
  )
}
