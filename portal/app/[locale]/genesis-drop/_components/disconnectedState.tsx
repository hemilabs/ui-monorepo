import { ButtonLoader } from 'components/buttonLoader'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'

const ConnectEvmWallet = dynamic(
  () => import('components/connectEvmWallet').then(mod => mod.ConnectEvmWallet),
  {
    loading: ButtonLoader,
    ssr: false,
  },
)

export const DisconnectedState = function () {
  const t = useTranslations('common')
  return (
    <div className="mt-5">
      <ConnectEvmWallet buttonSize="small" text={t('connect-wallet')} />
    </div>
  )
}
