import { PartnerImage } from './partnerImage'
import { PartnerLink } from './partnerLink'
import memebridgeLogo from './partnerLogos/memebridge.svg'

const url = 'https://www.memebridge.xyz/bridge'

export const Memebridge = () => (
  <PartnerLink
    icon={<PartnerImage alt="memebridge logo" src={memebridgeLogo} />}
    partner="memebridge"
    text="memebridge"
    url={url}
  />
)
