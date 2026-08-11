import { hemi, hemiSepolia } from 'hemi-viem'
import { Chain, type Client } from 'viem'

// The deposit and the withdrawal vaults may be the same, but they don't need to
// be. Both fall back to the vault that used to serve the two flows.
const depositBitcoinVaults: Record<Chain['id'], number> = {
  [hemi.id]: Number.parseInt(
    process.env.NEXT_PUBLIC_DEFAULT_BITCOIN_DEPOSIT_VAULT_MAINNET ||
      process.env.NEXT_PUBLIC_DEFAULT_BITCOIN_VAULT_MAINNET ||
      '0',
  ),
  [hemiSepolia.id]: Number.parseInt(
    process.env.NEXT_PUBLIC_DEFAULT_BITCOIN_DEPOSIT_VAULT_SEPOLIA ||
      process.env.NEXT_PUBLIC_DEFAULT_BITCOIN_VAULT_SEPOLIA ||
      '0',
  ),
}

const withdrawalBitcoinVaults: Record<Chain['id'], number> = {
  [hemi.id]: Number.parseInt(
    process.env.NEXT_PUBLIC_DEFAULT_BITCOIN_WITHDRAWAL_VAULT_MAINNET ||
      process.env.NEXT_PUBLIC_DEFAULT_BITCOIN_VAULT_MAINNET ||
      '0',
  ),
  [hemiSepolia.id]: Number.parseInt(
    process.env.NEXT_PUBLIC_DEFAULT_BITCOIN_WITHDRAWAL_VAULT_SEPOLIA ||
      process.env.NEXT_PUBLIC_DEFAULT_BITCOIN_VAULT_SEPOLIA ||
      '0',
  ),
}

const pastBitcoinVaults: Record<Chain['id'], number[]> = {
  [hemi.id]:
    process.env.NEXT_PUBLIC_BITCOIN_PAST_VAULTS_MAINNET?.split(',')?.map(
      Number,
    ) ?? [],
  [hemiSepolia.id]:
    process.env.NEXT_PUBLIC_BITCOIN_PAST_VAULTS_SEPOLIA?.split(',')?.map(
      Number,
    ) ?? [],
}

// In incoming iterations, the vault index will be determined programmatically
// once there's a way to get the "most adequate" custodial and support
// multiple types of vaults.
export const getBitcoinDepositVaultIndex = (client: Client) =>
  Promise.resolve(depositBitcoinVaults[client.chain!.id])

export const getBitcoinWithdrawalVaultIndex = (client: Client) =>
  Promise.resolve(withdrawalBitcoinVaults[client.chain!.id])

export const getVaultHistoricVaultIndexes = function (client: Client) {
  const chainId = client.chain!.id
  // deposits may have been made into the withdrawal vault, back when a single
  // vault served both flows
  const currentVaults = [
    depositBitcoinVaults[chainId],
    withdrawalBitcoinVaults[chainId],
  ]
  return Promise.resolve(
    [...new Set([...pastBitcoinVaults[chainId], ...currentVaults])].sort(
      (a, b) => a - b,
    ),
  )
}
