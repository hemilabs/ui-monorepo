import { Button } from 'components/button'
import { useDrawerContext } from 'hooks/useDrawerContext'
import { useUmami } from 'hooks/useUmami'
import { useTranslations } from 'use-intl'

export const ConnectBtcWallet = function () {
  const { openDrawer } = useDrawerContext()
  const t = useTranslations()
  const { track } = useUmami()

  const onClick = function () {
    openDrawer?.()
    track?.('btc connect')
  }

  return (
    <Button onClick={onClick} size="xLarge" type="button">
      {t('tunnel-page.submit-button.connect-btc-wallet')}
    </Button>
  )
}
