import { Chain } from 'viem'

import { PartnerImage } from './partnerImage'
import { PartnerLink } from './partnerLink'
import cobridgeLogo from './partnerLogos/cobridge.svg'

type Props = {
  fromChainId: Chain['id']
  toChainId: Chain['id']
}

export const Cobridge = function ({ fromChainId, toChainId }: Props) {
  const url = `https://cobridge.xyz/?to=${toChainId}&from=${fromChainId}`

  return (
    <PartnerLink
      icon={<PartnerImage alt="Cobridge logo" src={cobridgeLogo} />}
      partner="cobridge"
      text="Cobridge"
      url={url}
    />
  )
}
