import { Token } from 'types/token'
import { useTranslations } from 'use-intl'
import { isNativeToken } from 'utils/nativeToken'
import { queryStringObjectToString } from 'utils/url'
import { zeroAddress } from 'viem'

import { PartnerImage } from './partnerImage'
import { PartnerLink } from './partnerLink'
import jumperLogo from './partnerLogos/jumper.svg'

// Jumper uses the zero address for native tokens
const getJumperAddress = (token: Token) =>
  isNativeToken(token) ? zeroAddress : token.address

type Props = {
  fromToken: Token
  label?: string
  toToken: Token
}

export const Jumper = function ({ fromToken, label, toToken }: Props) {
  const t = useTranslations('tunnel-page.tunnel-partners')

  const url = `https://jumper.xyz/${queryStringObjectToString({
    fromChain: fromToken.chainId.toString(),
    fromToken: getJumperAddress(fromToken),
    toChain: toToken.chainId.toString(),
    toToken: getJumperAddress(toToken),
  })}`

  return (
    <PartnerLink
      icon={<PartnerImage alt="Jumper logo" src={jumperLogo} />}
      partner="jumper"
      text={label ?? t('tunnel-with-our-partner', { partner: 'Jumper' })}
      url={url}
    />
  )
}
