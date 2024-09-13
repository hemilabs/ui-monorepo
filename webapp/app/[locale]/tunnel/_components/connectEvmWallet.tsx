import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Button } from 'components/button'
import { useTranslations } from 'next-intl'

export const ConnectEvmWallet = function () {
  const t = useTranslations()
  const { openConnectModal } = useConnectModal()
  return (
    <Button onClick={openConnectModal} type="button">
      {t('tunnel-page.submit-button.connect-evm-wallet')}
    </Button>
  )
}
