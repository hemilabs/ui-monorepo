import { type PublicClient } from 'viem'
import { totalAssets } from 'viem-erc4626/actions'

import { type VaultToken } from '../types'

type VaultDeposit = VaultToken & {
  amount: bigint
}

export const fetchTotalDeposits = async function ({
  client,
  vaultTokens,
}: {
  client: PublicClient
  vaultTokens: VaultToken[]
}): Promise<VaultDeposit[]> {
  const amounts = await Promise.all(
    vaultTokens.map(({ vaultAddress }) =>
      totalAssets(client, { address: vaultAddress }),
    ),
  )
  return vaultTokens.map((vt, index) => ({
    ...vt,
    amount: amounts[index] ?? BigInt(0),
  }))
}
