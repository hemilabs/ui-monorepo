import Image, { StaticImageData } from 'next/image'

import coinbaseLogo from './logos/coinbase.svg'
import metamaskLogo from './logos/metamask.svg'
import okxLogo from './logos/okx.svg'
import rabbyLogo from './logos/rabby.svg'
import tokenPocketLogo from './logos/tokenPocket.svg'
import walletConnectLogo from './logos/walletConnect.svg'

function getLogo(walletName: string) {
  const wallets: Record<string, StaticImageData> = {
    coinbase: coinbaseLogo,
    metaMask: metamaskLogo,
    okx: okxLogo,
    rabby: rabbyLogo,
    tokenPocket: tokenPocketLogo,
    walletConnect: walletConnectLogo,
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
}: {
  walletName: string | undefined
}) {
  if (!walletName) {
    return null
  }
  return (
    <Image
      alt="Evm Wallet Logo"
      className="h-full w-full rounded-full"
      height={16}
      src={getLogo(walletName)}
      width={16}
    />
  )
}
