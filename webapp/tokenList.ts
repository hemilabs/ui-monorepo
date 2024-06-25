import hemilabsTokenList from '@hemilabs/token-list'
import { featureFlags } from 'app/featureFlags'
import { hemi } from 'app/networks'
import { bitcoinTestnet } from 'btc-wallet/chains'
import { Token } from 'types/token'
import { Address } from 'viem'
import { mainnet, sepolia } from 'wagmi/chains'

// Special address used by OP to store bridged eth
// See https://github.com/ethereum-optimism/optimism/blob/fa19f9aa250c0f548e0fdd226114aebf2c4c3fed/packages/contracts-bedrock/src/libraries/Predeploys.sol#L51
// While it is legacy, it is still being used
export const NativeTokenSpecialAddressOnL2 =
  '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000' as Address

const btcLogoUri = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Cg clip-path='url(%23clip0_2772_63828)'%3E%3Cpath d='M12 24.0107C18.6274 24.0107 24 18.6382 24 12.0107C24 5.38333 18.6274 0.0107422 12 0.0107422C5.37258 0.0107422 0 5.38333 0 12.0107C0 18.6382 5.37258 24.0107 12 24.0107Z' fill='%238A8A8A'/%3E%3Cpath d='M17.5202 10.6307C17.7668 9.10674 16.6882 8.40141 16.0828 8.01208C15.4802 7.62274 14.5588 7.34274 14.5588 7.34274L15.1482 4.96941L13.7882 4.62808L13.1988 7.00141L12.1122 6.72674L12.7015 4.35341L11.3255 4.01074L10.7362 6.38408L7.86016 5.66141L7.51083 7.06941C7.51083 7.06941 8.93083 7.42408 9.08683 7.46541C9.24683 7.50408 9.2255 7.58541 9.21216 7.63874C9.19883 7.69208 7.4255 14.8454 7.39883 14.9401C7.3775 15.0361 7.3615 15.0907 7.2295 15.0601L5.7215 14.6814L5.3335 16.2454L8.1175 16.9427L7.5535 19.2121L9.0375 19.5841L9.6015 17.3134L10.5255 17.5454L9.9615 19.8161L11.3748 20.1707L11.9402 17.9014L13.0042 18.1681C13.7108 18.3454 16.3962 18.3787 16.9802 16.0201C17.5655 13.6601 15.6308 12.6614 15.6308 12.6614C15.6308 12.6614 17.2708 12.1547 17.5202 10.6307ZM14.2975 15.0067C14.0175 16.1361 12.7575 16.2227 12.4708 16.1494L9.94416 15.5174L10.6908 12.5014L13.3108 13.1574C13.8135 13.2854 14.5788 13.8774 14.2975 15.0067ZM14.7642 10.4134C14.4655 11.6161 13.2655 11.5614 12.8868 11.4681L11.0402 11.0054L11.7522 8.13474L13.4375 8.55608C13.7255 8.62808 15.0642 9.21208 14.7642 10.4134Z' fill='white'/%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='clip0_2772_63828'%3E%3Crect width='24' height='24' fill='white' transform='translate(0 -0.00878906)'/%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E`
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
    extensions: {
      bridgeInfo: {
        // Leaving intentionally empty as there's no token address for native ETH in hemi
        [hemi.id]: {},
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
        [hemi.id]: {},
      },
    },
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

if (featureFlags.btcTunnelEnabled) {
  // TODO needs to be added to the token list https://github.com/BVM-priv/ui-monorepo/issues/356
  const btcTokenAddress = '0x816A8F283A09b0B233b35200b1bb934f2D2E1925'
  nativeTokens.push({
    address: bitcoinTestnet.nativeCurrency.symbol,
    chainId: bitcoinTestnet.id,
    decimals: bitcoinTestnet.nativeCurrency.decimals,
    extensions: {
      bridgeInfo: {
        [hemi.id]: {
          tokenAddress: btcTokenAddress,
        },
      },
    },
    logoURI: btcLogoUri,
    name: bitcoinTestnet.name,
    symbol: bitcoinTestnet.nativeCurrency.symbol,
  })
  tokens.push({
    address: btcTokenAddress,
    chainId: hemi.id,
    decimals: 8,
    extensions: {
      bridgeInfo: {
        // Leaving intentionally empty as there's no token address to bridge to in bitcoin
        // but we use this field to know the erc20 token address of btc in Hemi can be tunneled
        // to the Bitcoin network
        [bitcoinTestnet.id]: {},
      },
    },
    logoURI: btcLogoUri,
    name: bitcoinTestnet.name,
    symbol: bitcoinTestnet.nativeCurrency.symbol,
  })
}

export const tokenList = {
  keywords: ['default', 'uniswap'],
  name: 'Uniswap Labs Default',
  tags: {},
  timestamp: '2023-12-13T18:25:25.830Z',
  tokens: tokens.concat(nativeTokens),
}
