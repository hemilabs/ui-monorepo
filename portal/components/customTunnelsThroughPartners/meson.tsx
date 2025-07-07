import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { PartnerLink } from './partnerLink'
import mesonLogo from './partnerLogos/meson.svg'

type Props = {
  label?: string
}

export const Meson = function ({ label }: Props) {
  const t = useTranslations('tunnel-page.tunnel-partners')

  // TODO: This url should be updated once we have the template for Meson
  // https://github.com/hemilabs/ui-monorepo/issues/1047
  const url = 'https://meson.fi/swap'

  return (
    <PartnerLink
      icon={
        <Image
          alt="Meson logo"
          className="mr-2 rounded-lg"
          height={32}
          src={mesonLogo}
          width={32}
        />
      }
      partner="meson"
      text={label ?? t('tunnel-with-meson')}
      url={url}
    />
  )
}
