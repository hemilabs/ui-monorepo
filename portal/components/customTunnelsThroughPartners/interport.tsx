import { Chain } from 'viem'

import { PartnerImage } from './partnerImage'
import { PartnerLink } from './partnerLink'
import interportLogo from './partnerLogos/interport.svg'

type Props = {
  fromChainId: Chain['id']
  toChainId: Chain['id']
}

export const Interport = function ({ fromChainId, toChainId }: Props) {
  const url = `https://app.interport.fi/bridge/${fromChainId}/${toChainId}`

  return (
    <PartnerLink
      icon={<PartnerImage alt="Interport logo" src={interportLogo} />}
      partner="interport"
      text="Interport"
      url={url}
    />
  )
}
