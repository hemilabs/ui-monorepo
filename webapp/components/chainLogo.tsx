import {
  bitcoin,
  evmRemoteNetworks,
  hemi,
  type RemoteChain,
} from 'app/networks'
import { BtcLogo } from 'ui-common/components/btcLogo'
import { EthLogo } from 'ui-common/components/ethLogo'
import { HemiTokenWithBackground } from 'ui-common/components/hemiLogo'

const Logos = {
  [bitcoin.id]: BtcLogo,
  [hemi.id]: HemiTokenWithBackground,
  // Extend with multichain support
  // See https://github.com/BVM-priv/ui-monorepo/issues/158
  [evmRemoteNetworks[0].id]: EthLogo,
}

export const ChainLogo = function ({
  chainId,
}: {
  chainId: RemoteChain['id']
}) {
  const Logo = Logos[chainId]
  if (!Logo) {
    return <HemiTokenWithBackground />
  }
  return <Logo />
}
