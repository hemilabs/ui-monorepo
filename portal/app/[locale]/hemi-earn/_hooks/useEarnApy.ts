import { queryOptions } from '@tanstack/react-query'
import fetch from 'fetch-plus-plus'
import { type Address } from 'viem'

type ApyByVault = Partial<Record<Address, { apy: number }>>

// One network call serves every share (per-vault map); pair with selectApyValue for the per-share value.
export const earnApyQueryOptions = () =>
  queryOptions({
    queryFn: () =>
      fetch(
        `${import.meta.env.VITE_VETRO_API_URL}/variable-stake/apy`,
      ) as Promise<ApyByVault>,
    queryKey: ['hemi-earn', 'apy'],
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
  })

// Resolve one share's apy from the fetched map (keyed by staking vault): undefined while pending, null if settled-but-missing.
export const selectApyValue = (
  data: ApyByVault | undefined,
  isPending: boolean,
  stakingVault: Address,
) => (isPending ? undefined : (data?.[stakingVault]?.apy ?? null))
