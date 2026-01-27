import { useAccount as useBtcAccount } from 'btc-wallet/hooks/useAccount'
import { useConnect } from 'btc-wallet/hooks/useConnect'
import { useDisconnect as useBtcDisconnect } from 'btc-wallet/hooks/useDisconnect'
import {
  ConnectedBtcAccount,
  ConnectedBtcChain,
} from 'components/connectedWallet/connectedAccount'
import { FiatBalance } from 'components/fiatBalance'
import { type BtcWalletData, useAllWallets } from 'hooks/useAllWallets'
import { useBitcoin } from 'hooks/useBitcoin'
import { useChainIsSupported } from 'hooks/useChainIsSupported'
import { useTranslations } from 'next-intl'
import { isAndroid, isIOS } from 'react-device-detect'
import Skeleton from 'react-loading-skeleton'
import { getNativeToken } from 'utils/nativeToken'
import { walletIsConnected } from 'utils/wallet'

import { Box } from '../box'
import { BtcLogo } from '../btcLogo'
import { BtcWalletLogo } from '../btcWalletLogo'
import { ConnectToSupportedChain } from '../connectToSupportedChain'
import { ConnectWalletAccordion } from '../connectWalletAccordion'
import { DisconnectWallet } from '../disconnectWallet'

const getBtcWalletState = (wallet: BtcWalletData) => ({
  showCheck: wallet.installed,
  showInstall: !wallet.installed,
})

const getBtcWalletDownloadUrl = function (wallet: BtcWalletData) {
  if (isAndroid && wallet.downloadUrls?.android) {
    return wallet.downloadUrls.android
  }
  if (isIOS && wallet.downloadUrls?.ios) {
    return wallet.downloadUrls.ios
  }
  return wallet.downloadUrls?.chrome
}

export const BtcWallet = function () {
  const { chainId, status } = useBtcAccount()
  const bitcoin = useBitcoin()
  const { btcWallets } = useAllWallets()
  const chainSupported = useChainIsSupported(chainId)
  const { connect } = useConnect()
  const { disconnect } = useBtcDisconnect()

  const t = useTranslations('connect-wallets')

  const handleConnect = function (wallet: BtcWalletData) {
    if (wallet.installed) {
      connect(wallet.connector)
    } else {
      const downloadUrl = getBtcWalletDownloadUrl(wallet)
      if (downloadUrl) {
        window.open(downloadUrl, '_blank', 'noopener,noreferrer')
      }
    }
    // Return false to not show detail view (BTC doesn't need QR code)
    return false
  }

  if (status === 'connected') {
    return (
      <Box
        topContent={
          <>
            <ConnectedBtcAccount />
            <div className="flex items-center gap-1">
              <ConnectedBtcChain />
              <DisconnectWallet disconnect={disconnect} />
            </div>
          </>
        }
      >
        {chainSupported ? (
          <div className="flex items-end gap-x-1 p-2 text-4xl font-semibold text-neutral-950 md:p-4">
            <span>$</span>
            <FiatBalance token={getNativeToken(bitcoin.id)} />
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
        event="btc connect"
        getWalletState={getBtcWalletState}
        icon={<BtcLogo />}
        onConnect={handleConnect}
        renderLogo={wallet => (
          <BtcWalletLogo className="size-14" walletId={wallet.id} />
        )}
        text={t('connect-btc-wallet')}
        wallets={btcWallets}
      />
    )
  }

  return <Skeleton className="h-16 w-full rounded-lg" />
}
