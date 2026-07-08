'use client'

import { queryOptions } from '@tanstack/react-query'
import fetch from 'fetch-plus-plus'
import { isValidUrl } from 'utils/url'
import { type Address } from 'viem'

const apiUrl = process.env.NEXT_PUBLIC_VETRO_API_URL
export const isApyApiConfigured = apiUrl !== undefined && isValidUrl(apiUrl)

type ApyByVault = Partial<Record<Address, { apy: number }>>

// One network call serves every share (per-vault map); pair with selectApyValue for the per-share value.
export const earnApyQueryOptions = () =>
  queryOptions({
    enabled: isApyApiConfigured,
    queryFn: () => fetch(`${apiUrl}/variable-stake/apy`) as Promise<ApyByVault>,
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
