import { hemi, hemiSepolia } from 'hemi-viem'
import { Chain, type Client } from 'viem'

const defaultBitcoinVaults: Record<Chain['id'], number> = {
  [hemi.id]: Number.parseInt(
    process.env.NEXT_PUBLIC_DEFAULT_BITCOIN_VAULT_MAINNET || '0',
  ),
  [hemiSepolia.id]: Number.parseInt(
    process.env.NEXT_PUBLIC_DEFAULT_BITCOIN_VAULT_SEPOLIA || '0',
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

export const getVaultChildIndex = (client: Client) =>
  // In incoming iterations, the vault index will be determined programmatically
  // once there's a way to get the "most adequate" custodial and support
  // multiple types of vaults.
  Promise.resolve(defaultBitcoinVaults[client.chain!.id])

export const getVaultHistoricVaultIndexes = function (client: Client) {
  const currentVault = defaultBitcoinVaults[client.chain!.id]
  const pastVaults = pastBitcoinVaults[client.chain!.id]
  return Promise.resolve([...pastVaults, currentVault].sort())
}
