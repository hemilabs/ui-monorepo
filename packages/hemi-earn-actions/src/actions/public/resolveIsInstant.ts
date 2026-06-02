import {
  getCooldownEnabled,
  getInstantWithdrawWhitelist,
} from '@vetro-protocol/earn/actions'
import { type Address, type Client, isAddressEqual, zeroAddress } from 'viem'

// Mirrors `Agent.handleRedeemRequest` (Agent.sol:235):
//   _instantAllowed = !staking.cooldownEnabled() || staking.instantWithdrawWhitelist(caller)
// The Router needs `isInstant` declared up-front so it can reserve the right
// remote gas budget at quote/request time. If the value disagrees with the
// vault's actual state for `caller` when the Agent processes the message, the
// Agent sends an immediate cancel and the user pays gas for nothing — so this
// helper must match the Agent's check exactly.
export const resolveIsInstant = async function ({
  caller,
  client,
  stakingVault,
}: {
  caller: Address
  client: Client
  stakingVault: Address
}): Promise<boolean> {
  if (isAddressEqual(stakingVault, zeroAddress)) {
    throw new Error(
      'resolveIsInstant: `stakingVault` cannot be the zero address',
    )
  }
  if (isAddressEqual(caller, zeroAddress)) {
    throw new Error('resolveIsInstant: `caller` cannot be the zero address')
  }

  const [cooldownEnabled, whitelisted] = await Promise.all([
    getCooldownEnabled(client, { address: stakingVault }),
    getInstantWithdrawWhitelist(client, {
      account: caller,
      address: stakingVault,
    }),
  ])

  return !cooldownEnabled || whitelisted
}
