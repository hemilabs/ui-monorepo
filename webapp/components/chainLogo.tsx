import { bitcoinTestnet, bitcoinMainnet } from 'btc-wallet/chains'
import { BtcLogo } from 'components/icons/btcLogo'
import { EthLogo } from 'components/icons/ethLogo'
import { hemi as hemiMainnet, hemiSepolia as hemiSepolia } from 'hemi-viem'
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
    case hemiSepolia.id:
      return <HemiTokenWithBackground />
    case mainnet.id:
    case sepolia.id:
      return <EthLogo />
    default:
      return <HemiTokenWithBackground />
  }
}
