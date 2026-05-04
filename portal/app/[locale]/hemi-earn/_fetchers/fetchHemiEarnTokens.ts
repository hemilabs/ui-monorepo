import { getEarnVaultAddresses } from 'hemi-earn-actions'
import { type Address, type Chain, type PublicClient, zeroAddress } from 'viem'
import { asset } from 'viem-erc4626/actions'

type VaultAsset = {
  chainId: Chain['id']
  tokenAddress: Address
  vaultAddress: Address
}

export const fetchHemiEarnTokens = async function ({
  chainId,
  client,
}: {
  chainId: Chain['id']
  client: PublicClient
}): Promise<VaultAsset[]> {
  const vaultAddresses = getEarnVaultAddresses(chainId).filter(
    addr => addr !== zeroAddress,
  )
  const tokenAddresses = await Promise.all(
    vaultAddresses.map(addr => asset(client, { address: addr })),
  )
  return tokenAddresses.map((tokenAddress, index) => ({
    chainId,
    tokenAddress,
    vaultAddress: vaultAddresses[index],
  }))
}
