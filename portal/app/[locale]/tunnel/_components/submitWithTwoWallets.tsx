import { useUmami } from 'app/analyticsEvents'
import { Button } from 'components/button'
import { ButtonLoader } from 'components/buttonLoader'
import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
import { useAccounts } from 'hooks/useAccounts'
import { useBitcoin } from 'hooks/useBitcoin'
import { useDrawerContext } from 'hooks/useDrawerContext'
import { useNetworkType } from 'hooks/useNetworkType'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'

import { ConnectBtcWallet } from './connectBtcWallet'

type Props = {
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
  disabled,
  text,
  validationError,
}: Props) {
  const { allDisconnected, btcWalletStatus, evmWalletStatus } = useAccounts()
  const bitcoin = useBitcoin()
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
    <SubmitWhenConnectedToChain
      chainId={bitcoin.id}
      submitButton={
        <>
          {validationError ? (
            <Button disabled type="button">
              {validationError}
            </Button>
          ) : (
            <Button disabled={disabled} type="submit">
              {text}
            </Button>
          )}
        </>
      }
    />
  )
}
