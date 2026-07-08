import { useQuery } from '@tanstack/react-query'
import { getCooldownDuration } from '@vetro-protocol/earn/actions'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address } from 'viem'

// Governance-controlled and rarely changes; cache for hours to avoid refetch on every focus/reconnect.
const STALE_TIME_MS = 4 * 60 * 60 * 1000

// Raw cooldown duration in seconds (callers convert to days as needed).
export const useCooldownDuration = ({
  enabled = true,
  stakingVault,
}: {
  enabled?: boolean
  stakingVault: Address
}) =>
  useQuery({
    enabled,
    async queryFn() {
      const seconds = await getCooldownDuration(
        getEvmL1PublicClient(mainnet.id),
        { address: stakingVault },
      )
      return Number(seconds)
    },
    queryKey: ['hemi-earn', 'cooldown-duration', stakingVault],
    staleTime: STALE_TIME_MS,
  })
