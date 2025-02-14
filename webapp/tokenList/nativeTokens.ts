import hemilabsTokenList from '@hemilabs/token-list'
import { featureFlags } from 'app/featureFlags'
import { bitcoinTestnet } from 'btc-wallet/chains'
import { hemiMainnet } from 'networks/hemiMainnet'
import { hemiTestnet } from 'networks/hemiTestnet'
import { mainnet } from 'networks/mainnet'
import { sepolia } from 'networks/sepolia'
import { Token } from 'types/token'
import { Address } from 'viem'

// Special address used by OP to store bridged eth
// See https://github.com/ethereum-optimism/optimism/blob/fa19f9aa250c0f548e0fdd226114aebf2c4c3fed/packages/contracts-bedrock/src/libraries/Predeploys.sol#L51
// While it is legacy, it is still being used
export const NativeTokenSpecialAddressOnL2 =
  '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000' as Address

const ethLogoUri =
  'https://raw.githubusercontent.com/hemilabs/token-list/master/src/logos/eth.svg'

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
    logoURI: ethLogoUri,
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
    logoURI: ethLogoUri,
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
    logoURI: ethLogoUri,
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
    logoURI: ethLogoUri,
    name: hemiTestnet.nativeCurrency.name,
    symbol: hemiTestnet.nativeCurrency.symbol,
  },
]

if (featureFlags.btcTunnelEnabled) {
  const btcToken = hemilabsTokenList.tokens.find(
    t =>
      t.chainId === hemiTestnet.id &&
      // hemi testnet address of testnet bitcoin
      t.address === '0x36Ab5Dba83d5d470F670BC4c06d7Da685d9afAe7',
  )

  nativeTokens.push({
    address: bitcoinTestnet.nativeCurrency.symbol,
    chainId: bitcoinTestnet.id,
    decimals: bitcoinTestnet.nativeCurrency.decimals,
    extensions: {
      bridgeInfo: {
        [hemiTestnet.id]: {
          tokenAddress: btcToken.address as Address,
        },
      },
    },
    logoURI: btcToken.logoURI,
    name: bitcoinTestnet.name,
    symbol: bitcoinTestnet.nativeCurrency.symbol,
  })
}

export { nativeTokens }
