import hemilabsTokenList from '@hemilabs/token-list'
import {
  bitcoinTestnet,
  bitcoinMainnet,
  type BtcChain,
} from 'btc-wallet/chains'
import { hemiMainnet } from 'networks/hemiMainnet'
import { hemiTestnet } from 'networks/hemiTestnet'
import { mainnet } from 'networks/mainnet'
import { sepolia } from 'networks/sepolia'
import { type EvmToken, Token } from 'types/token'
import { getL1LogoURI } from 'utils/l1Logo'
import { type Address, type Chain } from 'viem'

// Special address used by OP to store bridged eth
// See https://github.com/ethereum-optimism/optimism/blob/fa19f9aa250c0f548e0fdd226114aebf2c4c3fed/packages/contracts-bedrock/src/libraries/Predeploys.sol#L51
// While it is legacy, it is still being used
export const NativeTokenSpecialAddressOnL2 =
  '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000' as Address

const hemiEthLogoURI = 'https://hemilabs.github.io/token-list/logos/eth.svg'

const ethLogoURI = getL1LogoURI({ logoURI: hemiEthLogoURI })

const nativeTokens: Token[] = [
  {
    address: mainnet.nativeCurrency.symbol,
    chainId: mainnet.id,
    decimals: mainnet.nativeCurrency.decimals,
    extensions: {
      bridgeInfo: {
        // Leaving intentionally empty as there's no token address for native ETH in hemi
        [hemiMainnet.id]: {},
      },
    },
    logoURI: ethLogoURI,
    name: mainnet.nativeCurrency.name,
    symbol: mainnet.nativeCurrency.symbol,
  },
  {
    address: sepolia.nativeCurrency.symbol,
    chainId: sepolia.id,
    decimals: sepolia.nativeCurrency.decimals,
    extensions: {
      bridgeInfo: {
        // Leaving intentionally empty as there's no token address for native ETH in hemi
        [hemiTestnet.id]: {},
      },
    },
    logoURI: ethLogoURI,
    name: sepolia.nativeCurrency.name,
    symbol: sepolia.nativeCurrency.symbol,
  },
  {
    address: hemiMainnet.nativeCurrency.symbol,
    chainId: hemiMainnet.id,
    decimals: hemiMainnet.nativeCurrency.decimals,
    extensions: {
      bridgeInfo: {
        [mainnet.id]: {
          tokenAddress: NativeTokenSpecialAddressOnL2,
        },
      },
    },
    logoURI: hemiEthLogoURI,
    name: hemiMainnet.nativeCurrency.name,
    symbol: hemiMainnet.nativeCurrency.symbol,
  },
  {
    address: hemiTestnet.nativeCurrency.symbol,
    chainId: hemiTestnet.id,
    decimals: hemiTestnet.nativeCurrency.decimals,
    extensions: {
      bridgeInfo: {
        [sepolia.id]: {
          tokenAddress: NativeTokenSpecialAddressOnL2,
        },
      },
    },
    logoURI: hemiEthLogoURI,
    name: hemiTestnet.nativeCurrency.name,
    symbol: hemiTestnet.nativeCurrency.symbol,
  },
]

const addBitcoinTokens = function ({
  btcChain,
  hemiChain,
}: {
  btcChain: BtcChain
  hemiChain: Chain
}) {
  const btcToken = (hemilabsTokenList.tokens as EvmToken[]).find(
    t =>
      t.chainId === hemiChain.id &&
      t.extensions?.bridgeInfo?.[btcChain.id] !== undefined,
  )

  if (!btcToken) {
    throw new Error(`Failed to find BTC token for chain ${hemiChain.name}`)
  }

  nativeTokens.push({
    address: btcChain.nativeCurrency.symbol,
    chainId: btcChain.id,
    decimals: btcChain.nativeCurrency.decimals,
    extensions: {
      bridgeInfo: {
        [hemiChain.id]: {
          tokenAddress: btcToken.address as Address,
        },
      },
    },
    logoURI: btcToken.logoURI,
    name: btcChain.name,
    symbol: btcChain.nativeCurrency.symbol,
  })
}

addBitcoinTokens({
  btcChain: bitcoinTestnet,
  hemiChain: hemiTestnet,
})

addBitcoinTokens({
  btcChain: bitcoinMainnet,
  hemiChain: hemiMainnet,
})

export { nativeTokens }
