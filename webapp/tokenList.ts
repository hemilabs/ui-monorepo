import hemilabsTokenList from '@hemilabs/token-list'
import { hemi } from 'app/networks'
import { Token } from 'types/token'
import { Address } from 'viem'
import { mainnet, sepolia } from 'wagmi/chains'

// Special address used by OP to store bridged eth
// See https://github.com/ethereum-optimism/optimism/blob/fa19f9aa250c0f548e0fdd226114aebf2c4c3fed/packages/contracts-bedrock/src/libraries/Predeploys.sol#L51
// While it is legacy, it is still being used
export const NativeTokenSpecialAddressOnL2 =
  '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000' as Address

const ethLogoUri = `data:image/svg+xml,%3Csvg fill='none' height='24' width='25' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23627EEA' d='M12.5 24c6.627 0 12-5.373 12-12s-5.373-12-12-12S.5 5.373.5 12s5.373 12 12 12Z' /%3E%3Cg fill='%23fff'%3E%3Cpath d='M12.873 3v6.652l5.623 2.513L12.873 3Z' fill-opacity='0.602' /%3E%3Cpath d='M12.873 3 7.25 12.165l5.623-2.512V3Z' /%3E%3Cpath d='M12.873 16.476v4.52l5.627-7.784-5.627 3.264Z' fill-opacity='0.602' /%3E%3Cpath d='M12.873 20.996v-4.52L7.25 13.211l5.623 7.784Z' /%3E%3Cpath d='m12.873 15.43 5.623-3.265-5.623-2.51v5.775Z' fill-opacity='0.2' /%3E%3Cpath d='m7.25 12.165 5.623 3.265V9.654L7.25 12.165Z' fill-opacity='0.602' /%3E%3C/g%3E%3C/svg%3E`

const hemiTokens: Token[] = (hemilabsTokenList.tokens as Token[])
  .filter(t => t.chainId === hemi.id)
  // WETH cannot be tunneled, so we must exclude it
  .filter(t => t.symbol !== 'WETH')

// the hemiTokens only contains definitions for Hemi tokens, but we can create the L1 version with the extensions field info
const l1HemiTokens = hemiTokens
  .filter(t => !!t.extensions?.bridgeInfo)
  .flatMap(t =>
    Object.keys(t.extensions.bridgeInfo).map(l1ChainId => ({
      ...t,
      address: t.extensions.bridgeInfo[l1ChainId].tokenAddress,
      chainId: Number(l1ChainId),
      extensions: {
        bridgeInfo: {
          [t.chainId]: {
            tokenAddress: t.address as Address,
          },
        },
      },
      name: t.name
        // Remove the "hemi tunneled" wording, as it is not part of L1
        .replace(/hemi tunneled/i, ''),
      symbol: t.symbol
        // Remove the ".e" suffix
        .replace('.e', '')

        .trim(),
    })),
  )

const tokens: Token[] = hemiTokens.concat(l1HemiTokens)

const nativeTokens: Token[] = [
  {
    address: mainnet.nativeCurrency.symbol,
    chainId: mainnet.id,
    decimals: mainnet.nativeCurrency.decimals,
    logoURI: ethLogoUri,
    name: mainnet.nativeCurrency.name,
    symbol: mainnet.nativeCurrency.symbol,
  },
  {
    address: sepolia.nativeCurrency.symbol,
    chainId: sepolia.id,
    decimals: sepolia.nativeCurrency.decimals,
    logoURI: ethLogoUri,
    name: sepolia.nativeCurrency.name,
    symbol: sepolia.nativeCurrency.symbol,
  },
  {
    address: hemi.nativeCurrency.symbol,
    chainId: hemi.id,
    decimals: hemi.nativeCurrency.decimals,
    extensions: {
      bridgeInfo: {
        [mainnet.id]: {
          tokenAddress: NativeTokenSpecialAddressOnL2,
        },
        [sepolia.id]: {
          tokenAddress: NativeTokenSpecialAddressOnL2,
        },
      },
    },
    name: hemi.nativeCurrency.name,
    symbol: hemi.nativeCurrency.symbol,
  },
]

export const tokenList = {
  keywords: ['default', 'uniswap'],
  name: 'Uniswap Labs Default',
  tags: {},
  timestamp: '2023-12-13T18:25:25.830Z',
  tokens: tokens.concat(nativeTokens),
}
