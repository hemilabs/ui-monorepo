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
import { useAccount as useEvmAccount } from 'wagmi'

import { Box } from '../box'
import { ConnectToSupportedChain } from '../connectToSupportedChain'
import { ConnectWalletAccordion } from '../connectWalletAccordion'
import { EthLogo } from '../ethLogo'

export const EvmWallet = function () {
  const { chain, chainId, status } = useEvmAccount()
  const t = useTranslations('connect-wallets')
  const allWallets = useAllWallets()
  const chainSupported = useChainIsSupported(chainId)

  if (status === 'connected') {
    return (
      <Box
        topContent={
          <>
            <ConnectedEvmAccount />
            <ConnectedEvmChain />
          </>
        }
      >
        {chainSupported && chain ? (
          <div className="flex items-end gap-x-1 px-3 py-2 text-4xl font-normal text-neutral-950">
            <span>$</span>
            <FiatBalance token={getNativeToken(chain.id)} />
          </div>
        ) : (
          <ConnectToSupportedChain />
        )}
      </Box>
    )
  }
  if (status === 'disconnected' || status === 'connecting') {
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
