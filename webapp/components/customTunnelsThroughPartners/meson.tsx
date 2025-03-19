import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { PartnerLink } from './partnerLink'
import mesonLogo from './partnerLogos/meson.svg'

export const Meson = function () {
  const t = useTranslations('tunnel-page.tunnel-partners')

  // TODO: This url should be updated once we have the template for Meson
  // https://github.com/hemilabs/ui-monorepo/issues/1047
  const url = 'https://meson.fi/swap'

  return (
    <PartnerLink
      icon={
        <Image
          alt="Meson Banner"
          className="mr-2 rounded-lg"
          height={32}
          src={mesonLogo}
          width={32}
        />
      }
      text={t('tunnel-with-meson')}
      url={url}
    />
  )
}
