import { EthLogo } from 'components/icons/ethLogo'
import { HemiLogo } from 'components/icons/hemiLogo'
import { useHemi } from 'hooks/useHemi'
import { Chain } from 'viem'

type Props = {
  chainId: Chain['id']
}

export const EvmLogo = function ({ chainId }: Props) {
  const hemi = useHemi()
  return chainId === hemi.id ? <HemiLogo /> : <EthLogo />
}
