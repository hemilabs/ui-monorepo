import { ConnectWalletDrawerContext } from 'context/connectWalletDrawerContext'
import { useAccounts } from 'hooks/useAccounts'
import { useTranslations } from 'next-intl'
import { useContext } from 'react'
import { Button } from 'ui-common/components/button'

import { ConnectBtcWallet } from './connectBtcWallet'
import { ConnectEvmWallet } from './connectEvmWallet'

type Props = {
  disabled: boolean
  text: string
}

export const SubmitWithTwoWallets = function ({ disabled, text }: Props) {
  const { allDisconnected, btcWalletStatus, evmWalletStatus } = useAccounts()
  const { openDrawer } = useContext(ConnectWalletDrawerContext)
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
