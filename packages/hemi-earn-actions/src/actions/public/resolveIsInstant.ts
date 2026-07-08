import {
  getCooldownEnabled,
  getInstantWithdrawWhitelist,
} from '@vetro-protocol/earn/actions'
import { type Address, type Client } from 'viem'

// Mirrors Agent.handleRedeemRequest exactly; any drift makes the Agent cancel and the user eats gas.
export const resolveIsInstant = async function ({
  caller,
  client,
  stakingVault,
}: {
  caller: Address
  client: Client
  stakingVault: Address
}): Promise<boolean> {
  const [cooldownEnabled, whitelisted] = await Promise.all([
    getCooldownEnabled(client, { address: stakingVault }),
    getInstantWithdrawWhitelist(client, {
      account: caller,
      address: stakingVault,
    }),
  ])

  return !cooldownEnabled || whitelisted
}
