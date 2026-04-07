import { getEarnVaultAddresses } from 'hemi-earn-actions'
import { type EvmToken } from 'types/token'
import { type Chain, type PublicClient, zeroAddress } from 'viem'
import { totalAssets } from 'viem-erc4626/actions'

type VaultDeposit = {
  amount: bigint
  token: EvmToken
}

export const fetchTotalDeposits = async function ({
  chainId,
  client,
  tokens,
}: {
  chainId: Chain['id']
  client: PublicClient
  tokens: EvmToken[]
}): Promise<VaultDeposit[]> {
  const vaultAddresses = getEarnVaultAddresses(chainId)
  const amounts = await Promise.all(
    tokens.map(function (_, index) {
      const vaultAddress = vaultAddresses[index]
      return vaultAddress && vaultAddress !== zeroAddress
        ? totalAssets(client, { address: vaultAddress })
        : Promise.resolve(BigInt(0))
    }),
  )
  return tokens.map((token, index) => ({
    amount: amounts[index] ?? BigInt(0),
    token,
  }))
}
