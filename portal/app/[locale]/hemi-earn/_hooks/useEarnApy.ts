'use client'

import { queryOptions } from '@tanstack/react-query'
import fetch from 'fetch-plus-plus'
import { isValidUrl } from 'utils/url'
import { type Address } from 'viem'

const apiUrl = process.env.NEXT_PUBLIC_VETRO_API_URL
export const isApyApiConfigured = apiUrl !== undefined && isValidUrl(apiUrl)

type ApyByVault = Partial<Record<Address, { apy: number }>>

// Shared queryOptions: a single network call serves every share via the
// per-vault map returned by the API. Pair with `selectApyValue` below to
// resolve the per-share tri-state from a parent query subscription.
export const earnApyQueryOptions = () =>
  queryOptions({
    enabled: isApyApiConfigured,
    queryFn: () => fetch(`${apiUrl}/variable-stake/apy`) as Promise<ApyByVault>,
    queryKey: ['hemi-earn', 'apy'],
    refetchInterval: 5 * 60 * 1000, // refetch every 5 min
    retry: 2,
  })

// Resolve the apy for a single share against an already-fetched response.
// The API keys its per-vault map by the share's Ethereum-side staking vault,
// so callers pass that (`pool.stakingVault`). Returns `undefined` while the
// query is pending, `null` once settled but missing for that vault (errored
// response or vault not in the payload), and the apy number otherwise.
export const selectApyValue = (
  data: ApyByVault | undefined,
  isPending: boolean,
  stakingVault: Address,
) => (isPending ? undefined : data?.[stakingVault]?.apy ?? null)
