import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useTranslations } from 'next-intl'
import { Button } from 'ui-common/components/button'

export const ConnectWallet = function () {
  const t = useTranslations()
  const { openConnectModal } = useConnectModal()
  return (
    <Button onClick={openConnectModal} type="button">
      {t('common.connect-wallet')}
    </Button>
  )
}
