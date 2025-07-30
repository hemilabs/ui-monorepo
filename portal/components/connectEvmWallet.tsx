import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Button, ButtonSize } from 'components/button'
import { useUmami } from 'hooks/useUmami'
import { useTranslations } from 'next-intl'

export const ConnectEvmWallet = function ({
  buttonSize = 'xLarge',
  text,
}: {
  buttonSize?: ButtonSize
  text?: string
}) {
  const { openConnectModal } = useConnectModal()
  const t = useTranslations()
  const { track } = useUmami()

  const onClick = function () {
    track?.('evm connect')
    openConnectModal()
  }

  return (
    <Button onClick={onClick} size={buttonSize} type="button">
      {text ?? t('connect-wallets.connect-evm-wallet')}
    </Button>
  )
}
