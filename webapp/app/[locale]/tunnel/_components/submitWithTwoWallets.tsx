import { useUmami } from 'app/analyticsEvents'
import { Button } from 'components/button'
import { useAccounts } from 'hooks/useAccounts'
import { useDrawerContext } from 'hooks/useDrawerContext'
import { useNetworkType } from 'hooks/useNetworkType'
import { useTranslations } from 'next-intl'

import { ConnectBtcWallet } from './connectBtcWallet'
import { ConnectEvmWallet } from './connectEvmWallet'

type Props = {
  disabled: boolean
  text: string
}

export const SubmitWithTwoWallets = function ({ disabled, text }: Props) {
  const { allDisconnected, btcWalletStatus, evmWalletStatus } = useAccounts()
  const { openDrawer } = useDrawerContext()
  const [networkType] = useNetworkType()
  const t = useTranslations('tunnel-page.submit-button')
  const { track } = useUmami()

  if (allDisconnected) {
    const onClick = function () {
      openDrawer()
      track?.('form - connect wallets', { chain: networkType })
    }
    return (
      <Button onClick={onClick} type="button">
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
