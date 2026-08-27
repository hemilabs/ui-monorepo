import { Button } from 'components/button'
import { ButtonLoader } from 'components/buttonLoader'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
import { useAccounts } from 'hooks/useAccounts'
import { useBitcoin } from 'hooks/useBitcoin'
import { useDrawerContext } from 'hooks/useDrawerContext'
import { useUmami } from 'hooks/useUmami'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'

import { ConnectBtcWallet } from './connectBtcWallet'

type Props = {
  btcWalletRequired: boolean
  disabled: boolean
  text: string
  validationError: string | undefined
}

const ConnectEvmWallet = dynamic(
  () => import('components/connectEvmWallet').then(mod => mod.ConnectEvmWallet),
  {
    loading: () => <ButtonLoader />,
    ssr: false,
  },
)

export const SubmitWithTwoWallets = function ({
  btcWalletRequired,
  disabled,
  text,
  validationError,
}: Props) {
  const { allDisconnected, btcWalletStatus, evmWalletStatus } = useAccounts()
  const bitcoin = useBitcoin()
  const { openDrawer } = useDrawerContext()
  const t = useTranslations('tunnel-page.submit-button')
  const { track } = useUmami()

  if (btcWalletRequired && allDisconnected) {
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
    return <ConnectEvmWallet />
  }

  if (btcWalletRequired && btcWalletStatus !== 'connected') {
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

  if (!btcWalletRequired) {
    return <SubmitWhenConnected submitButton={submitButton} />
  }

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
