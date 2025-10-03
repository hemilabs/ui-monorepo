import { useTranslations } from 'next-intl'

import { PartnerImage } from './partnerImage'
import { PartnerLink } from './partnerLink'
import mesonLogo from './partnerLogos/meson.svg'

type Props = {
  label?: string
}

const url = 'https://meson.fi/swap'

export const Meson = function ({ label }: Props) {
  const t = useTranslations('tunnel-page.tunnel-partners')

  return (
    <PartnerLink
      icon={<PartnerImage alt="Meson logo" src={mesonLogo} />}
      partner="meson"
      text={label ?? t('tunnel-with-our-partner', { partner: 'Meson' })}
      url={url}
    />
  )
}
