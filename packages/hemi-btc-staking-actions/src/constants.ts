import { hemi, hemiSepolia } from 'hemi-viem'
import { type Address } from 'viem'

// TODO: Add contract addresses when available
// See https://github.com/hemilabs/ui-monorepo/issues/1619
const BTC_STAKING_VAULT_CONTRACT_ADDRESSES: Record<number, Address> = {
  [hemi.id]: '0x0000000000000000000000000000000000000000',
  [hemiSepolia.id]: '0x0000000000000000000000000000000000000000',
} as const

export const getBtcStakingVaultContractAddress = function (chainId: number) {
  const address = BTC_STAKING_VAULT_CONTRACT_ADDRESSES[chainId]
  if (!address) {
    throw new Error(
      `BTC Staking Vault contract not deployed on chain ${chainId}`,
    )
  }
  return address
}
