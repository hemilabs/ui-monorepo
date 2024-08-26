import { useHemi } from 'hooks/useHemi'
import { Chain } from 'viem'

import { EthLogo } from './ethLogo'
import { HemiLogo } from './hemiLogo'

type Props = {
  chainId: Chain['id']
}

//See https://github.com/hemilabs/ui-monorepo/issues/158
export const EvmLogo = function ({ chainId }: Props) {
  const hemi = useHemi()
  return chainId === hemi.id ? <HemiLogo /> : <EthLogo />
}
