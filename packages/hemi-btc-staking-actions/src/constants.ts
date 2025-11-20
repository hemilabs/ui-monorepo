import { hemi, hemiSepolia } from 'hemi-viem'
import { type Address } from 'viem'

const BTC_STAKING_VAULT_CONTRACT_ADDRESSES: Record<number, Address> = {
  [hemi.id]: '0x17BA356d3DFc89fc0cE3d6ABdfE1dd29a69A55cf',
  [hemiSepolia.id]: '0x07c5C83C7F963dFD5De3075140886F8Ee87d1468',
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
