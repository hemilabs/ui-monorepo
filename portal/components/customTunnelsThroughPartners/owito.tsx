import { PartnerImage } from './partnerImage'
import { PartnerLink } from './partnerLink'
import owitoLogo from './partnerLogos/owito.png'

const url = 'https://owlto.finance/'

export const OwIto = () => (
  <PartnerLink
    icon={<PartnerImage alt="OwIto logo" src={owitoLogo} />}
    partner="owito"
    text="OwIto"
    url={url}
  />
)
