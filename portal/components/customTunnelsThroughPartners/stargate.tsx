import { hemi } from 'hemi-viem'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Token } from 'types/token'
import { isNativeAddress } from 'utils/nativeToken'
import { queryStringObjectToString } from 'utils/url'
import { mainnet } from 'viem/chains'

import { PartnerLink } from './partnerLink'
import stargateLogo from './partnerLogos/stargate.svg'

// Stargate uses this address for ETH
const stargateEthereumAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
const stargateChainNameMap = {
  [hemi.id]: 'hemi',
  [mainnet.id]: 'ethereum',
}

type Props = {
  fromToken: Token
  label?: string
  toToken: Token
}

export const Stargate = function ({ fromToken, label, toToken }: Props) {
  const t = useTranslations('tunnel-page.tunnel-partners')

  const url = `https://stargate.finance/bridge${queryStringObjectToString({
    dstChain: stargateChainNameMap[toToken.chainId],
    dstToken: isNativeAddress(toToken.address)
      ? stargateEthereumAddress
      : toToken.address,
    srcChain: stargateChainNameMap[fromToken.chainId],
    srcToken: isNativeAddress(fromToken.address)
      ? stargateEthereumAddress
      : fromToken.address,
  })}`

  return (
    <PartnerLink
      icon={
        <Image
          alt="Stargate logo"
          className="mr-2 rounded-lg bg-black p-1.5"
          height={32}
          src={stargateLogo}
          width={32}
        />
      }
      partner="stargate"
      text={label ?? t('tunnel-with-stargate')}
      url={url}
    />
  )
}
