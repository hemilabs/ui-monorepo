import { useBitcoin } from 'hooks/useBitcoin'
import { useNetworkType } from 'hooks/useNetworkType'
import Image from 'next/image'
import { Token } from 'types/token'
import { isBtcNetworkId } from 'utils/chain'
import { getNativeToken } from 'utils/nativeToken'

import { CustomTokenLogo } from './customTokenLogo'
import { HemiSubLogo } from './hemiSubLogo'
import { BtcLogo } from './icons/btcLogo'

const sizes = {
  medium: 'size-8',
  small: 'size-5',
} as const

type Size = keyof typeof sizes

type Props = {
  size: Size
  token: Token
}

// for hemi tokens, we add a hemi logo at the bottom right
export function TokenLogo({ size, token }: Props) {
  const [networkType] = useNetworkType()
  const bitcoinChain = useBitcoin()
  const bitcoinToken = getNativeToken(bitcoinChain.id)

  // BTC and tBTC have special logo rendering.
  // On Hemi (mainnet), only BTC uses the preset logo because tBTC represents a different token.
  // On Hemi Sepolia (testnet), both BTC and tBTC use the preset logo.
  const isTestnet = networkType === 'testnet'
  const isHemiBtc =
    token.extensions.bridgeInfo?.[bitcoinToken.chainId]?.tokenAddress ===
    bitcoinToken.address
  if (isBtcNetworkId(token.chainId) || (isTestnet && isHemiBtc)) {
    return (
      <div className={`relative ${sizes[size]}`}>
        <div className="flex size-full items-center justify-center">
          <BtcLogo className="size-full" />
        </div>
        {isTestnet && isHemiBtc && <HemiSubLogo size={size} token={token} />}
      </div>
    )
  }

  return token.logoURI ? (
    <div className={`relative ${sizes[size]}`}>
      <Image
        alt={`${token.name} Logo`}
        className="w-full"
        height={20}
        src={token.logoURI}
        width={20}
      />
    </div>
  ) : (
    <div className={`relative ${sizes[size]}`}>
      <CustomTokenLogo size={size} token={token} />
    </div>
  )
}
