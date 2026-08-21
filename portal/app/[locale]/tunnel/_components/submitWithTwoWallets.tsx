import { Button } from 'components/button'
import { LazyConnectEvmWallet } from 'components/lazyConnectEvmWallet'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
import { useAccounts } from 'hooks/useAccounts'
import { useBitcoin } from 'hooks/useBitcoin'
import { useDrawerContext } from 'hooks/useDrawerContext'
import { useUmami } from 'hooks/useUmami'
import { useTranslations } from 'next-intl'

import { ConnectBtcWallet } from './connectBtcWallet'

type Props = {
  disabled: boolean
  text: string
  validationError: string | undefined
}

export const SubmitWithTwoWallets = function ({
  disabled,
  text,
  validationError,
}: Props) {
  const { allDisconnected, btcWalletStatus, evmWalletStatus } = useAccounts()
  const bitcoin = useBitcoin()
  const { openDrawer } = useDrawerContext()
  const t = useTranslations('tunnel-page.submit-button')
  const { track } = useUmami()

  if (allDisconnected) {
    const onClick = function () {
      openDrawer()
      track?.('form - connect wallets')
    }
    return (
      <Button onClick={onClick} size="xLarge" type="button">
        {t('connect-both-wallets')}
      </Button>
    )
  }

  if (evmWalletStatus !== 'connected') {
    return <LazyConnectEvmWallet />
  }

  if (btcWalletStatus !== 'connected') {
    return <ConnectBtcWallet />
  }

  const submitButton = validationError ? (
    <Button disabled size="xLarge" type="button">
      {validationError}
    </Button>
  ) : (
    <Button disabled={disabled} size="xLarge" type="submit">
      {text}
    </Button>
  )

  return (
    <SubmitWhenConnectedToChain
      chainId={bitcoin.id}
      submitButton={
        <SubmitWhenConnected
          submitButton={<SubmitWhenConnected submitButton={submitButton} />}
        />
      }
    />
  )
}
