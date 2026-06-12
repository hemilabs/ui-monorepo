import { useQuery } from '@tanstack/react-query'
import { getCooldownDuration } from '@vetro-protocol/earn/actions'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address } from 'viem'

// `cooldownDuration` is governance-controlled and rarely changes. Caching
// for a few hours avoids refetching on every window focus / wallet
// reconnect.
const STALE_TIME_MS = 4 * 60 * 60 * 1000

// Returns the raw on-chain cooldown duration in seconds. Callers that just
// need the day count (e.g. the warning banner) convert with
// `secondsToDays`; the withdraw drawer's live countdown needs the raw
// seconds to tick at minute resolution. Takes the Ethereum-side staking vault
// (`pool.stakingVault`) directly — callers already hold it.
export const useCooldownDuration = ({
  stakingVault,
}: {
  stakingVault: Address
}) =>
  useQuery({
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
