import { ButtonLoader } from 'components/buttonLoader'
import { useTranslations } from 'next-intl'
import { lazy, Suspense } from 'react'

const ConnectEvmWallet = lazy(() =>
  import('components/connectEvmWallet').then(mod => ({
    default: mod.ConnectEvmWallet,
  })),
)

export const DisconnectedState = function () {
  const t = useTranslations('common')
  return (
    <div className="mt-5">
      <Suspense fallback={<ButtonLoader />}>
        <ConnectEvmWallet buttonSize="small" text={t('connect-wallet')} />
      </Suspense>
    </div>
  )
}
