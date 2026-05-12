import { type PublicClient } from 'viem'

import { type VaultToken } from '../types'

type VaultDeposit = VaultToken & {
  amount: bigint
}

// TODO(phase-2): mocked intentionally. `totalAssets` (TVL) lives on the
// StakingVault (ERC-4626) on Ethereum, so this fetcher will need to query
// cross-chain (RPC Ethereum or a subgraph) once that pipeline is set up. Out
// of scope for the Router refactor.
export const fetchTotalDeposits = async ({
  vaultTokens,
}: {
  client: PublicClient
  vaultTokens: VaultToken[]
}): Promise<VaultDeposit[]> =>
  vaultTokens.map(vt => ({
    ...vt,
    amount: BigInt(0),
  }))
