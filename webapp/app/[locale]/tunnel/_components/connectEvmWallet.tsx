import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useUmami } from 'app/analyticsEvents'
import { Button } from 'components/button'
import { useNetworkType } from 'hooks/useNetworkType'
import { useTranslations } from 'next-intl'

export const ConnectEvmWallet = function () {
  const { openConnectModal } = useConnectModal()
  const [networkType] = useNetworkType()
  const t = useTranslations()
  const { track } = useUmami()

  const onClick = function () {
    track?.('evm connect', { chain: networkType })
    openConnectModal()
  }

  return (
    <Button onClick={onClick} type="button">
      {t('tunnel-page.submit-button.connect-evm-wallet')}
    </Button>
  )
}
