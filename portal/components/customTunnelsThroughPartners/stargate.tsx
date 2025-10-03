import { useChain } from 'hooks/useChain'
import { useTranslations } from 'next-intl'
import { Token } from 'types/token'
import { isNativeAddress } from 'utils/nativeToken'
import { queryStringObjectToString } from 'utils/url'

import { PartnerImage } from './partnerImage'
import { PartnerLink } from './partnerLink'
import stargateLogo from './partnerLogos/stargate.svg'

// Stargate uses this address for ETH
const stargateEthereumAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

type Props = {
  fromToken: Token
  label?: string
  toToken: Token
}

export const Stargate = function ({ fromToken, label, toToken }: Props) {
  const t = useTranslations('tunnel-page.tunnel-partners')

  const fromChain = useChain(fromToken.chainId)
  const toChain = useChain(toToken.chainId)

  const url = `https://stargate.finance/bridge${queryStringObjectToString({
    dstChain: toChain!.name.toLowerCase(),
    dstToken: isNativeAddress(toToken.address)
      ? stargateEthereumAddress
      : toToken.address,
    srcChain: fromChain!.name.toLowerCase(),
    srcToken: isNativeAddress(fromToken.address)
      ? stargateEthereumAddress
      : fromToken.address,
  })}`

  return (
    <PartnerLink
      icon={<PartnerImage alt="Stargate logo" src={stargateLogo} />}
      partner="stargate"
      text={label ?? t('tunnel-with-our-partner', { partner: 'Stargate' })}
      url={url}
    />
  )
}
