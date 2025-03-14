import { hemi } from 'hemi-viem'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Token } from 'types/token'
import { queryStringObjectToString } from 'utils/url'
import { mainnet } from 'viem/chains'

import { PartnerLink } from './partnerLink'
import stargateLogo from './partnerLogos/stargate.svg'

const stargateChainNameMap = {
  [hemi.id]: 'hemi',
  [mainnet.id]: 'ethereum',
}

type Props = {
  fromToken: Token
  toToken: Token
}

export const Stargate = function ({ fromToken, toToken }: Props) {
  const t = useTranslations('tunnel-page.tunnel-partners')

  const url = `https://stargate.finance/bridge${queryStringObjectToString({
    dstChain: stargateChainNameMap[toToken.chainId],
    dstToken: toToken.address,
    srcChain: stargateChainNameMap[fromToken.chainId],
    srcToken: fromToken.address,
  })}`

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
      url={url}
    />
  )
}
