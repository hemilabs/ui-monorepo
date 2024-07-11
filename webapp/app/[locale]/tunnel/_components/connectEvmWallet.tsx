import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useTranslations } from 'next-intl'
import { Button } from 'ui-common/components/button'

export const ConnectEvmWallet = function () {
  const t = useTranslations()
  const { openConnectModal } = useConnectModal()
  return (
    <Button onClick={openConnectModal} type="button">
      {t('tunnel-page.submit-button.connect-evm-wallet')}
    </Button>
  )
}
