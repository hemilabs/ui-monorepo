import { useTranslations } from 'next-intl'

import { PartnerImage } from './partnerImage'
import { PartnerLink } from './partnerLink'
import freeTechLogo from './partnerLogos/freetech.svg'

const url = 'https://tunnel.free.tech'

type Props = {
  label?: string
}

export const FreeTech = function ({ label }: Props) {
  const t = useTranslations('tunnel-page.tunnel-partners')
  return (
    <PartnerLink
      icon={<PartnerImage alt="Free Tech logo" src={freeTechLogo} />}
      partner="free tech"
      text={label ?? t('tunnel-with-our-partner', { partner: 'Free Tech' })}
      url={url}
    />
  )
}
