import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Button } from 'components/button'
import { useUmami } from 'hooks/useUmami'
import { useTranslations } from 'next-intl'

export const ConnectEvmWallet = function ({ text }: { text?: string }) {
  const { openConnectModal } = useConnectModal()
  const t = useTranslations()
  const { track } = useUmami()

  const onClick = function () {
    track?.('evm connect')
    openConnectModal()
  }

  return (
    <Button fontSize="text-mid" onClick={onClick} type="button">
      {text ?? t('connect-wallets.connect-evm-wallet')}
    </Button>
  )
}
