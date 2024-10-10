import { bitcoinTestnet, bitcoinMainnet } from 'btc-wallet/chains'
import { BtcLogo } from 'components/icons/btcLogo'
import { EthLogo } from 'components/icons/ethLogo'
import { hemiMainnet } from 'networks/hemiMainnet'
import { hemiTestnet } from 'networks/hemiTestnet'
import { mainnet } from 'networks/mainnet'
import { sepolia } from 'networks/sepolia'
import { type RemoteChain } from 'types/chain'
import { HemiTokenWithBackground } from 'ui-common/components/hemiLogo'

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
