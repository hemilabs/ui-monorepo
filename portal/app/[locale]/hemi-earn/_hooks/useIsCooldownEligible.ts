import { useQuery } from '@tanstack/react-query'
import { getStakingVaultForShare } from 'hemi-earn-actions'
import { resolveIsInstant } from 'hemi-earn-actions/actions'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address } from 'viem'

// Underlying reads (`cooldownEnabled`, `instantWithdrawWhitelist`) are
// governance/admin-controlled and change infrequently. Caching for a few
// hours avoids refetching on every window focus / wallet reconnect.
const STALE_TIME_MS = 4 * 60 * 60 * 1000

// Resolves whether the caller is subject to the vault's 7-day withdraw cooldown
// (i.e. cooldown is enabled AND the caller is not on the instant-withdraw
// whitelist). Mirrors `resolveIsInstant` and inverts it so the consumer can
// gate UI like "withdraw takes 7 days" on a single boolean.
export const useIsCooldownEligible = ({
  account,
  shareAddress,
}: {
  account: Address | undefined
  shareAddress: Address
}) =>
  useQuery({
    enabled: !!account,
    async queryFn() {
      const isInstant = await resolveIsInstant({
        caller: account!,
        client: getEvmL1PublicClient(mainnet.id),
        stakingVault: getStakingVaultForShare(shareAddress),
      })
      return !isInstant
    },
    queryKey: ['hemi-earn', 'cooldown-eligible', shareAddress, account],
    staleTime: STALE_TIME_MS,
  })
