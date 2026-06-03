import { useQuery } from '@tanstack/react-query'
import { getCooldownDuration } from '@vetro-protocol/earn/actions'
import { getStakingVaultForShare } from 'hemi-earn-actions'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address } from 'viem'

const SECONDS_IN_DAY = 86_400
// `cooldownDuration` is governance-controlled and rarely changes. Caching
// for a few hours avoids refetching on every window focus / wallet
// reconnect.
const STALE_TIME_MS = 4 * 60 * 60 * 1000

export const useCooldownDuration = ({
  shareAddress,
}: {
  shareAddress: Address
}) =>
  useQuery({
    async queryFn() {
      const seconds = await getCooldownDuration(
        getEvmL1PublicClient(mainnet.id),
        { address: getStakingVaultForShare(shareAddress) },
      )
      return Math.round(Number(seconds) / SECONDS_IN_DAY)
    },
    queryKey: ['hemi-earn', 'cooldown-duration', shareAddress],
    staleTime: STALE_TIME_MS,
  })
