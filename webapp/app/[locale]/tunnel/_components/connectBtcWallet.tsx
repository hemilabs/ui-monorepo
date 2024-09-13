import { useConfig } from 'btc-wallet/hooks/useConfig'
import { useConnect } from 'btc-wallet/hooks/useConnect'
import { Button } from 'components/button'
import { useTranslations } from 'next-intl'

export const ConnectBtcWallet = function () {
  const config = useConfig()
  const { connect } = useConnect()
  const t = useTranslations()

  return (
    <Button onClick={() => connect(config.connectors[0].wallet)} type="button">
      {t('tunnel-page.submit-button.connect-btc-wallet')}
    </Button>
  )
}
