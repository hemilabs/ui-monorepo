import { bitcoin, evmRemoteNetworks, type RemoteChain } from 'app/networks'
import { hemi as hemiMainnet, hemiSepolia as hemiSepolia } from 'hemi-viem'
import { BtcLogo } from 'ui-common/components/btcLogo'
import { EthLogo } from 'ui-common/components/ethLogo'
import { HemiTokenWithBackground } from 'ui-common/components/hemiLogo'

export const ChainLogo = function ({
  chainId,
}: {
  chainId: RemoteChain['id']
}) {
  switch (chainId) {
    case bitcoin.id:
      return <BtcLogo />
    case hemiMainnet.id:
    case hemiSepolia.id:
      return <HemiTokenWithBackground />
    case evmRemoteNetworks[0].id:
      return <EthLogo />
    default:
      return <HemiTokenWithBackground />
  }
}
