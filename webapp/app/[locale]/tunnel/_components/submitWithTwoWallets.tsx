import { useAccounts } from 'hooks/useAccounts'
import { useDrawerContext } from 'hooks/useDrawerContext'
import { useTranslations } from 'next-intl'
import { Button } from 'ui-common/components/button'

import { ConnectBtcWallet } from './connectBtcWallet'
import { ConnectEvmWallet } from './connectEvmWallet'

type Props = {
  disabled: boolean
  text: string
}

export const SubmitWithTwoWallets = function ({ disabled, text }: Props) {
  const { allDisconnected, btcWalletStatus, evmWalletStatus } = useAccounts()
  const { openDrawer } = useDrawerContext()
  const t = useTranslations('tunnel-page.submit-button')

  if (allDisconnected) {
    return (
      <Button onClick={openDrawer} type="button">
        {t('connect-both-wallets')}
      </Button>
    )
  }

  if (evmWalletStatus !== 'connected') {
    return <ConnectEvmWallet />
  }

  if (btcWalletStatus !== 'connected') {
    return <ConnectBtcWallet />
  }

  return (
    <Button disabled={disabled} type="submit">
      {text}
    </Button>
  )
}
