import { hemi } from 'app/networks'
import { EthLogo } from 'ui-common/components/ethLogo'
import { HemiTokenWithBackground } from 'ui-common/components/hemiLogo'
import { type Chain } from 'viem'

// Extend with multichain support
// See https://github.com/BVM-priv/ui-monorepo/issues/158
export const ChainLogo = ({ chainId }: { chainId: Chain['id'] }) =>
  chainId === hemi.id ? <HemiTokenWithBackground /> : <EthLogo />
