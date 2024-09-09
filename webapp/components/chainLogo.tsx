import { bitcoinTestnet, bitcoinMainnet } from 'btc-wallet/chains'
import { BtcLogo } from 'components/icons/btcLogo'
import { hemi as hemiMainnet, hemiSepolia as hemiSepolia } from 'hemi-viem'
import { type RemoteChain } from 'types/chain'
import { EthLogo } from 'ui-common/components/ethLogo'
import { HemiTokenWithBackground } from 'ui-common/components/hemiLogo'
import { mainnet, sepolia } from 'viem/chains'

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
