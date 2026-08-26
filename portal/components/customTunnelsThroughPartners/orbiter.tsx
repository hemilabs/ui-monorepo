import { useChain } from 'hooks/useChain'
import { Token } from 'types/token'
import { useTranslations } from 'use-intl'
import { Chain } from 'viem'

import { PartnerImage } from './partnerImage'
import { PartnerLink } from './partnerLink'
import orbiterLogo from './partnerLogos/orbiter.svg'

type Props = {
  fromToken: Token
  label?: string
  toToken: Token
}

export const Orbiter = function ({ fromToken, label, toToken }: Props) {
  const t = useTranslations('tunnel-page.tunnel-partners')

  const fromChain = useChain(fromToken.chainId) as Chain
  const toChain = useChain(toToken.chainId) as Chain

  const url = `https://www.orbiter.finance/bridge/${fromChain.name}/${toChain.name}?token=${fromToken.symbol}`

  return (
    <PartnerLink
      icon={<PartnerImage alt="Orbiter logo" src={orbiterLogo} />}
      partner="orbiter"
      text={label ?? t('tunnel-with-our-partner', { partner: 'Orbiter' })}
      url={url}
    />
  )
}
