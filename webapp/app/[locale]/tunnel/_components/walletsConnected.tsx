import { ConnectionStatus } from 'btc-wallet/types'
import { useAccounts } from 'hooks/useAccounts'
import { useTranslations } from 'next-intl'

const Wallet = function ({
  status,
  title,
}: {
  status: ConnectionStatus
  title: string
}) {
  const t = useTranslations('connect-wallets.status')

  return (
    <div className="flex items-center gap-x-1 text-xs font-medium leading-normal">
      <span className="text-slate-600">{`${title}:`}</span>
      <span
        className={
          status === 'disconnected' ? 'text-slate-950' : 'text-emerald-500'
        }
      >
        {t(status)}
      </span>
    </div>
  )
}

export const WalletsConnected = function () {
  const { btcWalletStatus, evmWalletStatus } = useAccounts()
  const t = useTranslations('connect-wallets')
  return (
    <div className="flex flex-nowrap items-center justify-between px-6 md:px-9">
      <Wallet status={evmWalletStatus} title={t('evm-wallet')} />
      <Wallet status={btcWalletStatus} title={t('btc-wallet')} />
    </div>
  )
}
