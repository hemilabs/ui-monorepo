import { bitcoinTestnet, bitcoinMainnet } from 'btc-wallet/chains'
import { BtcLogo } from 'components/icons/btcLogo'
import { EthLogo } from 'components/icons/ethLogo'
import { Image } from 'components/image'
import { hemiMainnet } from 'networks/hemiMainnet'
import { hemiTestnet } from 'networks/hemiTestnet'
import { mainnet } from 'networks/mainnet'
import { sepolia } from 'networks/sepolia'
import { type RemoteChain } from 'types/chain'

const HemiTokenWithBackground = () => (
  <Image alt="Hemi" height={20} src="/hemi.svg" width={20} />
)

export const ChainLogo = function ({
  chainId,
}: {
  chainId: RemoteChain['id']
}) {
  switch (chainId) {
    case bitcoinMainnet.id:
    case bitcoinTestnet.id:
      return <BtcLogo />
    case hemiMainnet.id:
    case hemiTestnet.id:
      return <HemiTokenWithBackground />
    case mainnet.id:
    case sepolia.id:
      return <EthLogo />
    default:
      return <HemiTokenWithBackground />
  }
}
