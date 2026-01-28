import {
  ConnectedEvmAccount,
  ConnectedEvmChain,
} from 'components/connectedWallet/connectedAccount'
import { FiatBalance } from 'components/fiatBalance'
import { useAllWallets } from 'hooks/useAllWallets'
import { useChainIsSupported } from 'hooks/useChainIsSupported'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { getNativeToken } from 'utils/nativeToken'
import { walletIsConnected } from 'utils/wallet'
import {
  useAccount as useEvmAccount,
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

export const EvmWallet = function () {
  const { chain, chainId, connector, status } = useEvmAccount()
  const t = useTranslations('connect-wallets')
  const { evmWallets } = useAllWallets()
  const chainSupported = useChainIsSupported(chainId)
  const { disconnect } = useEvmDisconnect()
  const { handleConnect } = useEvmWalletConnect()

  // Disconnect the specific connector that is currently connected
  // This ensures proper cleanup and allows reconnecting the same wallet
  const disconnectWallet = () => disconnect({ connector })

  if (status === 'connected') {
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
  if (!walletIsConnected(status)) {
    return (
      <ConnectWalletAccordion
        event="evm connect"
        getWalletState={getEvmWalletState}
        icon={<EthLogo />}
        onConnect={handleConnect}
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
  return <Skeleton className="h-16 w-full rounded-lg" />
}
