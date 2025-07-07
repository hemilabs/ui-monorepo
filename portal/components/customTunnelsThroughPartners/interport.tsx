import Image from 'next/image'
import { Chain } from 'viem'

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
      icon={
        <Image
          alt="Interport logo"
          className="mr-2 rounded-lg"
          height={32}
          src={interportLogo}
          width={32}
        />
      }
      partner="interport"
      text="Interport"
      url={url}
    />
  )
}
