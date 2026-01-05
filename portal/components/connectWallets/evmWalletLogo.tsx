import { ComponentProps, ReactNode } from 'react'

import { BinanceWalletLogo } from './logos/binanceWallet'
import { CoinbaseWalletLogo } from './logos/coinbaseWallet'
import { MetamaskLogo } from './logos/metamask'
import { OkxWalletLogo } from './logos/okxWallet'
import { PhantomWalletLogo } from './logos/phantomWallet'
import { RabbyWalletLogo } from './logos/rabbyWallet'
import { TokenPocketLogo } from './logos/tokenPocket'
import { WalletConnectLogo } from './logos/walletConnect'

function getLogo(walletName: string, props?: ComponentProps<'svg'>) {
  const wallets: Record<string, ReactNode> = {
    binance: <BinanceWalletLogo {...props} />,
    coinbase: <CoinbaseWalletLogo {...props} />,
    metaMask: <MetamaskLogo {...props} />,
    okx: <OkxWalletLogo {...props} />,
    phantom: <PhantomWalletLogo {...props} />,
    rabby: <RabbyWalletLogo {...props} />,
    tokenPocket: <TokenPocketLogo {...props} />,
    walletConnect: <WalletConnectLogo {...props} />,
  }
  // Why this check instead of using the wallet's ids? All injected wallets override window.ethereum.
  // This causes some weird collisions where the wallet id takes different forms. For example, I found cases
  // where rabby's id was "io.rabby", or tokenPocket's was the URL to download the wallet.
  // I checked wagmi's repo (as they define the connectors) and they just state that injected wallets are unreliable
  // I was unable to match by id, but in general, the wallet id contains the name of the wallet
  // This check seems to work well enough
  const walletKey = Object.keys(wallets).find(key =>
    walletName.toLowerCase().includes(key.toLowerCase()),
  )
  // If we don't recognize the wallet, the only option left is that it connected through walletConnect
  return wallets[walletKey || 'walletConnect']
}

export const EvmWalletLogo = function ({
  walletName,
  ...props
}: {
  walletName: string | undefined
} & ComponentProps<'svg'>) {
  if (!walletName) {
    return null
  }
  return getLogo(walletName, props)
}
