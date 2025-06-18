import Image from 'next/image'

import { PartnerLink } from './partnerLink'
import freeTechLogo from './partnerLogos/freetech.svg'

export const FreeTech = function () {
  // TODO: This url should be updated once we have the template for Free Tech
  // https://github.com/hemilabs/ui-monorepo/issues/1047
  const url = 'https://tunnel.free.tech'

  return (
    <PartnerLink
      icon={
        <Image
          alt="Free Tech logo"
          className="mr-2 rounded-lg"
          height={32}
          src={freeTechLogo}
          width={32}
        />
      }
      text="Free Tech"
      url={url}
    />
  )
}
