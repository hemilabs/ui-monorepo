import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { PartnerLink } from './partnerLink'
import stargateLogo from './partnerLogos/stargate.svg'

export const Stargate = function () {
  const t = useTranslations('tunnel-page.tunnel-partners')
  return (
    <PartnerLink
      icon={
        <Image
          alt="Stargate Banner"
          className="mr-2 rounded-lg bg-black p-1.5"
          height={32}
          src={stargateLogo}
          width={32}
        />
      }
      text={t('tunnel-with-stargate')}
      // URL is TBD, see https://github.com/hemilabs/ui-monorepo/issues/719
      url="https://stargate.finance"
    />
  )
}
