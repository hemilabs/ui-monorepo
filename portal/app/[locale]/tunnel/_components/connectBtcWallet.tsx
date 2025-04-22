import { useUmami } from 'app/analyticsEvents'
import { useConfig } from 'btc-wallet/hooks/useConfig'
import { useConnect } from 'btc-wallet/hooks/useConnect'
import { Button } from 'components/button'
import { useNetworkType } from 'hooks/useNetworkType'
import { useTranslations } from 'next-intl'

export const ConnectBtcWallet = function () {
  const config = useConfig()
  const { connect } = useConnect()
  const [networkType] = useNetworkType()
  const t = useTranslations()
  const { track } = useUmami()

  const onClick = function () {
    connect(config.connectors[0].wallet)
    track?.('btc connect', { chain: networkType })
  }

  return (
    <Button onClick={onClick} type="button">
      {t('tunnel-page.submit-button.connect-btc-wallet')}
    </Button>
  )
}
