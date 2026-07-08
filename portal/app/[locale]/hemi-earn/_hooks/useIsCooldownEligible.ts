import { useQuery } from '@tanstack/react-query'
import { resolveIsInstant } from 'hemi-earn-actions/actions'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address } from 'viem'

// Governance-controlled and rarely changes; cache for hours to avoid refetch on every focus/reconnect.
const STALE_TIME_MS = 4 * 60 * 60 * 1000

// True when the caller is subject to the withdraw cooldown — the inverse of resolveIsInstant, for gating UI on one boolean.
export const useIsCooldownEligible = ({
  account,
  stakingVault,
}: {
  account: Address | undefined
  stakingVault: Address
}) =>
  useQuery({
    enabled: !!account,
    async queryFn() {
      const isInstant = await resolveIsInstant({
        caller: account!,
        client: getEvmL1PublicClient(mainnet.id),
        stakingVault,
      })
      return !isInstant
    },
    queryKey: ['hemi-earn', 'cooldown-eligible', stakingVault, account],
    staleTime: STALE_TIME_MS,
  })
