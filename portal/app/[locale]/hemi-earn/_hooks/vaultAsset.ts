import { queryOptions } from '@tanstack/react-query'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address } from 'viem'
import { asset as getVaultAsset } from 'viem-erc4626/actions'

// The vault's asset() — the pegged token backing it. Immutable per deployment
// (cache forever); shared across consumers so the read runs once per vault.
export const vaultAssetQueryOptions = (vault: Address) =>
  queryOptions({
    queryFn: () =>
      getVaultAsset(getEvmL1PublicClient(mainnet.id), { address: vault }),
    queryKey: ['hemi-earn', 'vault-asset', vault],
    staleTime: Infinity,
  })
