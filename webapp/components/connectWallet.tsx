import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useTranslations } from 'next-intl'
import { Card } from 'ui-common/components/card'

export const ConnectWallet = function () {
  const t = useTranslations()
  return (
    <Card borderColor="gray" radius="large">
      <div className="flex h-[50dvh] w-full flex-col items-center justify-center gap-y-2">
        <h3 className="text-2xl font-normal text-black">
          {t('common.connect-your-wallet')}
        </h3>
        <p className="text-base font-normal text-slate-500">
          {t('transaction-history.connect-wallet-to-review')}
        </p>
        <div className="mt-2">
          <ConnectButton />
        </div>
      </div>
    </Card>
  )
}
