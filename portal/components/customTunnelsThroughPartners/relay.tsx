import { PartnerImage } from './partnerImage'
import { PartnerLink } from './partnerLink'
import relayLogo from './partnerLogos/relay.svg'

const url = 'https://relay.link/bridge/hemi'

export const Relay = () => (
  <PartnerLink
    icon={<PartnerImage alt="Relay logo" src={relayLogo} />}
    partner="relay"
    text="Relay"
    url={url}
  />
)
