import hemilabsTokenList from '@hemilabs/token-list'
import { hemi, hemiSepolia } from 'hemi-viem'
import partition from 'lodash/partition'
import { RemoteChain } from 'types/chain'
import { Extensions } from 'types/token'
import { isNativeAddress } from 'utils/nativeToken'
import { type Chain } from 'viem'
import { mainnet, sepolia } from 'viem/chains'

const mainnetAddresses = [
  // AAVE
  '0xB2960608948C4D216f72F98C39Eb3d0E775E3923',
  // bwAJNA
  '0x63D367531B460Da78a9EBBAF6c1FBFC397E5d40A',
  // COMP
  '0xc9FE18dEF46952bAB59Bd15fBAC865346F621649',
  // DAI
  '0x6c851F501a3F24E29A8E39a29591cddf09369080',
  // ETH native token
  mainnet.nativeCurrency.symbol,
  // FRAX
  '0xc4a20a608616F18aA631316eEDa9Fb62d089361e',
  // HEMI BTC
  '0xAA40c0c7644e0b2B224509571e10ad20d9C4ef28',
  // LINK
  '0x584666A5024B9Fe9e6a9caCb834F42CCaA248D08',
  // LMR
  '0x98D6E32f3092D39A6c0B36062cC9EB1E52Ccc99D',
  // MET
  '0x54dF33333C78C13B1448CB35A0E49F75C3D4347F',
  // MKR
  '0x4f6a87566eBcA017b147DA84954d94B10d830727',
  // SUSHI
  '0x1EBD781B9259822d00b0c5F4Ca2F0838D72BBE9c',
  // tBTC (v2)
  '0x12B6e6FC45f81cDa81d2656B974E8190e4ab8D93',
  // UNI
  '0x6fD31f56eb971113bEA12C5883deC68337b3B7b5',
  // USDC
  '0xad11a8BEb98bbf61dbb1aa0F6d6F2ECD87b35afA',
  // USDT
  '0xbB0D083fb1be0A9f6157ec484b6C79E0A4e31C2e',
  // VSP
  '0x21c1F6be5765d378AdD561edDdD1127a65df3820',
  // VUSD
  '0x7A06C4AeF988e7925575C50261297a946aD204A8',
  // WBTC
  '0x03C7054BCB39f7b2e5B2c7AcB37583e32D70Cfa3',
  // ZRO
  '0xDF0e8f7b7FDA30605cA5665161F9f3dDb489c870',
]

const testnetAddresses = [
  // tBTC testnet
  '0x36Ab5Dba83d5d470F670BC4c06d7Da685d9afAe7',
  // DAI
  '0xec46E0EFB2EA8152da0327a5Eb3FF9a43956F13e',
  // ETH native token
  sepolia.nativeCurrency.symbol,
  // USDC
  '0xD47971C7F5B1067d25cd45d30b2c9eb60de96443',
  // USDT
  '0x3Adf21A6cbc9ce6D5a3ea401E7Bae9499d391298',
  // rUSDC-hemi
  '0x931d9e210530184C321EA4ee6238cCB4D0AB5236',
]

/**
 * Given a list of addresses on Hemi, it returns a whitelist object to enable tunneling for these addresses and their L1 counterparts
 */
const whitelistTunnel = function (hemiChain: Chain, addresses: string[]) {
  // native tokens, if enabled, don't check for a bridge extension. They're straight marked as enabled
  const [nativeTokens, erc20Tokens] = partition(addresses, isNativeAddress)

  const l1Addresses = erc20Tokens
    .map(
      address =>
        hemilabsTokenList.tokens.find(
          t => t.chainId === hemiChain.id && t.address === address,
        )?.extensions?.bridgeInfo?.[hemiChain.sourceId]?.tokenAddress satisfies
          | string
          | undefined,
    )
    // remove empty
    .filter(Boolean)
    .concat(nativeTokens)

  const enableTunnel = (addr: string[]) =>
    Object.fromEntries(addr.map(address => [address, { tunnel: true }]))

  return {
    // L1
    [hemiChain.sourceId]: enableTunnel(l1Addresses),
    // L2
    [hemiChain.id]: enableTunnel(addresses),
  }
}

export const tunnelWhiteList: Partial<
  Record<RemoteChain['id'], Record<string, Pick<Extensions, 'tunnel'>>>
> = {
  ...whitelistTunnel(hemi, mainnetAddresses),
  ...whitelistTunnel(hemiSepolia, testnetAddresses),
}
