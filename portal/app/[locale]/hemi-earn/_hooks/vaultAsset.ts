import { queryOptions } from '@tanstack/react-query'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address } from 'viem'
import { asset as getVaultAsset } from 'viem-erc4626/actions'

// Ethereum-side ERC-4626 staking vault's `asset()` — the pegged token (vBTC,
// vUSD) backing the vault. Immutable per deployment, so cache forever. Shared
// by pegged-token resolution (`fetchHemiEarnShares`) and gateway resolution
// (`gatewayForRemoteShare`) so the `asset()` read happens once per vault.
export const vaultAssetQueryOptions = (vault: Address) =>
  queryOptions({
    queryFn: () =>
      getVaultAsset(getEvmL1PublicClient(mainnet.id), { address: vault }),
    queryKey: ['hemi-earn', 'vault-asset', vault],
    staleTime: Infinity,
  })
