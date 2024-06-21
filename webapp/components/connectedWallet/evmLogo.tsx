import { hemi } from 'app/networks'
import { Chain } from 'viem'

import { EthLogo } from './ethLogo'
import { HemiLogo } from './hemiLogo'

type Props = {
  chainId: Chain['id']
}

//See https://github.com/BVM-priv/ui-monorepo/issues/158
export const EvmLogo = ({ chainId }: Props) =>
  chainId === hemi.id ? <HemiLogo /> : <EthLogo />
