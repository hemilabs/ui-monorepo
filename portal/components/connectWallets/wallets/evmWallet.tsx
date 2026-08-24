import {
  ConnectedEvmAccount,
  ConnectedEvmChain,
} from 'components/connectedWallet/connectedAccount'
import { FiatBalance } from 'components/fiatBalance'
import { useAllWallets } from 'hooks/useAllWallets'
import { useChainIsSupported } from 'hooks/useChainIsSupported'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { getNativeToken } from 'utils/nativeToken'
import { walletIsConnected } from 'utils/wallet'
import {
  useAccount as useEvmAccount,
  useConnect,
  useDisconnect as useEvmDisconnect,
} from 'wagmi'

import { Box } from '../box'
import { ConnectToSupportedChain } from '../connectToSupportedChain'
import { ConnectWalletAccordion } from '../connectWalletAccordion'
import { DisconnectWallet } from '../disconnectWallet'
import { EthLogo } from '../ethLogo'
import { EvmWalletLogo } from '../evmWalletLogo'
import {
  getEvmWalletState,
  useEvmWalletConnect,
} from '../hooks/useEvmWalletConnect'
import { WalletQRCodeView } from '../walletQRCodeView'

const STALE_CONNECTING_MS = 10_000

export const EvmWallet = function () {
  const { chain, chainId, connector, status } = useEvmAccount()
  const t = useTranslations('connect-wallets')
  const { evmWallets } = useAllWallets()
  const chainSupported = useChainIsSupported(chainId)
  const { disconnect } = useEvmDisconnect()
  const { reset: resetConnect } = useConnect()
  const { handleConnect } = useEvmWalletConnect()

  // Whether the pending connection is driven by the WalletConnect QR code view.
  // While it is, the accordion (and its QR view) must stay mounted and the
  // stale-connecting timeout must not fire, since the user needs time to scan.
  const [isConnectingWithQrCode, setIsConnectingWithQrCode] = useState(false)

  const onConnect = useCallback(
    async function (wallet: Parameters<typeof handleConnect>[0]) {
      const showDetailView = await handleConnect(wallet)
      if (showDetailView !== false) {
        setIsConnectingWithQrCode(true)
      }
      return showDetailView
    },
    [handleConnect],
  )

  // Keep the QR-connecting flag honest: clear it as soon as the connection is
  // no longer pending (connected, or the user left/the pairing expired), rather
  // than waiting for the next connection attempt.
  useEffect(
    function resetQrConnectingOnceSettled() {
      if (status !== 'connecting') {
        setIsConnectingWithQrCode(false)
      }
    },
    [status],
  )

  // Disconnect the specific connector that is currently connected
  // This ensures proper cleanup and allows reconnecting the same wallet
  const disconnectWallet = useCallback(
    () => disconnect({ connector }),
    [connector, disconnect],
  )

  useEffect(
    function abortConnectingAfterTimeout() {
      // Skip the abort while the WalletConnect QR code view is open: the user
      // may need more time to scan, and the QR view manages its own lifecycle.
      if (status !== 'connecting' || isConnectingWithQrCode) {
        return undefined
      }
      const id = window.setTimeout(function () {
        disconnectWallet()
        resetConnect()
      }, STALE_CONNECTING_MS)
      return function clearConnectingAbortTimer() {
        window.clearTimeout(id)
      }
    },
    [disconnectWallet, isConnectingWithQrCode, resetConnect, status],
  )

  if (walletIsConnected(status)) {
    return (
      <Box
        topContent={
          <>
            <ConnectedEvmAccount />
            <div className="flex items-center gap-1">
              <ConnectedEvmChain />
              <DisconnectWallet disconnect={disconnectWallet} />
            </div>
          </>
        }
      >
        {chainSupported && chain ? (
          <div className="flex items-end gap-x-1 p-2 text-4xl font-semibold text-neutral-950 md:p-4">
            <span>$</span>
            <FiatBalance token={getNativeToken(chain.id)} />
          </div>
        ) : (
          <div className="flex w-full justify-center">
            <ConnectToSupportedChain />
          </div>
        )}
      </Box>
    )
  }

  if (status === 'connecting' && !isConnectingWithQrCode) {
    return <Skeleton className="h-16 w-full rounded-lg" />
  }

  return (
    <ConnectWalletAccordion
      event="evm connect"
      getWalletState={getEvmWalletState}
      icon={<EthLogo />}
      onConnect={onConnect}
      renderDetailView={(wallet, onBack) => (
        <WalletQRCodeView onBack={onBack} wallet={wallet} />
      )}
      renderLogo={wallet => (
        <EvmWalletLogo className="size-14" walletName={wallet.name} />
      )}
      text={t('connect-evm-wallet')}
      wallets={evmWallets}
    />
  )
}
