import { useQuery } from '@tanstack/react-query'
import { type Address, type Chain } from 'viem'

export const getUserVaultBalanceQueryKey = ({
  chainId,
  vaultAddress,
}: {
  chainId: Chain['id'] | undefined
  vaultAddress: Address
}) => ['hemi-earn', 'user-vault-balance', chainId, vaultAddress]

// TODO(phase-2): mocked intentionally. Real implementation needs to read the
// user's sVetBTC OFT balance on Hemi and convert it to underlying assets via
// the StakingVault on Ethereum (`convertToAssets`).
//
// IMPORTANT: the returned value MUST be asset-denominated (8 decimals for the
// BTC variants), NOT raw share units (18 decimals). `validateSubmit` in
// `withdraw.tsx` parses the user input with `pool.token` (asset) decimals and
// compares against this balance — returning shares here would silently break
// validation under the asset-unit UX.
export const useUserVaultBalance = (
  vaultAddress: Address,
  chainId: Chain['id'],
) =>
  useQuery({
    queryFn: () => BigInt(0),
    queryKey: getUserVaultBalanceQueryKey({ chainId, vaultAddress }),
  })
