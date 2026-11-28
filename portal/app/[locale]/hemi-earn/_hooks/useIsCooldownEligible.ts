import { useQuery } from '@tanstack/react-query'
import { resolveIsInstant } from '@vetro-protocol/hemi-earn/actions'
import { mainnet } from 'networks/mainnet'
import { getEvmL1PublicClient } from 'utils/chainClients'
import { type Address } from 'viem'

import { cooldownStaleTimeMs } from '../_constants/cooldown'

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
      const isInstant = await resolveIsInstant(
        getEvmL1PublicClient(mainnet.id),
        { address: stakingVault, caller: account! },
      )
      return !isInstant
    },
    queryKey: ['hemi-earn', 'cooldown-eligible', stakingVault, account],
    staleTime: cooldownStaleTimeMs,
  })
