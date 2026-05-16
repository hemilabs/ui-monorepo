'use client'

import { useQuery } from '@tanstack/react-query'
import {
  getHemiEarnRouterAddress,
  getHemiEarnRouterBirthBlock,
} from 'hemi-earn-actions'
import { type RegistryEntry, getAssetRegistry } from 'hemi-earn-actions/actions'
import { hemi } from 'hemi-viem'
import { getHemiClient } from 'utils/chainClients'

const hemiEarnRegistryKey = ['hemi-earn', 'asset-registry']

// Reads the (asset → share) registry from the Hemi-side Router by scanning
// `AssetDataUpdated` events. Cached for a long time because the registry
// changes rarely (owner updates only). Consumers that need to refresh after
// an owner action can `queryClient.invalidateQueries({ queryKey: hemiEarnRegistryKey })`.
// `fromBlock` is pinned to the Router's deployment block so production RPCs
// don't sweep the entire chain history on every cold load.
export const useHemiEarnRegistry = () =>
  useQuery<RegistryEntry[]>({
    queryFn: () =>
      getAssetRegistry({
        client: getHemiClient(hemi.id),
        fromBlock: getHemiEarnRouterBirthBlock(),
        routerAddress: getHemiEarnRouterAddress(),
      }),
    queryKey: hemiEarnRegistryKey,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
