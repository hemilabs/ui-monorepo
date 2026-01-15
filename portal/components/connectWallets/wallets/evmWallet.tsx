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
  useConnect,
  useAccount as useEvmAccount,
  useDisconnect as useEvmDisconnect,
} from 'wagmi'

import { Box } from '../box'
import { ConnectToSupportedChain } from '../connectToSupportedChain'
import { ConnectWalletAccordion } from '../connectWalletAccordion'
import { DisconnectWallet } from '../disconnectWallet'
import { EthLogo } from '../ethLogo'

export const EvmWallet = function () {
  const { chain, chainId, status } = useEvmAccount()
  const t = useTranslations('connect-wallets')
  const allWallets = useAllWallets()
  const chainSupported = useChainIsSupported(chainId)
  const { disconnect } = useEvmDisconnect()
  const { reset } = useConnect()

  const disconnectWallet = function () {
    disconnect()
    reset()
  }

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
        icon={<EthLogo />}
        text={t('connect-evm-wallet')}
        wallets={allWallets}
      />
    )
  }
  return <Skeleton className="h-16 w-full rounded-lg" />
}
