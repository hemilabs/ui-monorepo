import { LazyConnectEvmWallet } from 'components/lazyConnectEvmWallet'
import { useTranslations } from 'use-intl'

export const DisconnectedState = function () {
  const t = useTranslations('common')
  return (
    <div className="mt-5">
      <LazyConnectEvmWallet buttonSize="small" text={t('connect-wallet')} />
    </div>
  )
}
