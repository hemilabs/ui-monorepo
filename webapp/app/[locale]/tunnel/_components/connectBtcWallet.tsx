import { useConfig } from 'btc-wallet/hooks/useConfig'
import { useConnect } from 'btc-wallet/hooks/useConnect'
import { useTranslations } from 'next-intl'
import { Button } from 'ui-common/components/button'

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
