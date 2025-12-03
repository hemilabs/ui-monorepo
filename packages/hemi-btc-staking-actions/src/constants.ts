import { hemi, hemiSepolia } from 'hemi-viem'
import { type Address } from 'viem'

const BTC_STAKING_VAULT_CONTRACT_ADDRESSES: Record<number, Address> = {
  [hemi.id]: '0xC95873B97E28FFfC9230A335cE193D8D7f09e523',
  [hemiSepolia.id]: '0x36d8F34EED05Dbc7d2C07c06fCCFD35dF6178e59',
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
