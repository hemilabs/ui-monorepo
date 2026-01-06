import { Button, ButtonSize } from 'components/button'
import { useDrawerContext } from 'hooks/useDrawerContext'
import { useUmami } from 'hooks/useUmami'
import { useTranslations } from 'next-intl'

export const ConnectEvmWallet = function ({
  buttonSize = 'xLarge',
  text,
}: {
  buttonSize?: ButtonSize
  text?: string
}) {
  const { openDrawer } = useDrawerContext()
  const t = useTranslations()
  const { track } = useUmami()

  const onClick = function () {
    openDrawer?.()
    track?.('evm connect')
  }

  return (
    <Button onClick={onClick} size={buttonSize} type="button">
      {text ?? t('connect-wallets.connect-evm-wallet')}
    </Button>
  )
}
