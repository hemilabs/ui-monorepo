import { PartnerImage } from './partnerImage'
import { PartnerLink } from './partnerLink'
import fireflyLogo from './partnerLogos/firefly.svg'

const url = 'https://fireflylabs.app'

export const FireFly = () => (
  <PartnerLink
    icon={<PartnerImage alt="FireFly logo" src={fireflyLogo} />}
    partner="firefly"
    text="FireFly"
    url={url}
  />
)
