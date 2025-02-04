import { type Client } from 'viem'

import {
  stakedBalance,
  stakeTokenAllowlist,
} from './actions/public/stakeManager'

/**
 * Extends a Viem `Client` with staking-related actions.
 *
 * @param {Object} options - Additional configuration options.
 * @returns {Function} A function that extends the Viem `Client`.
 */
export const hemiPublicStakeActions = () => (client: Client) => ({
  stakedBalance: (params: Parameters<typeof stakedBalance>[1]) =>
    stakedBalance(client, params),
  stakeTokenAllowlist: (params: Parameters<typeof stakeTokenAllowlist>[1]) =>
    stakeTokenAllowlist(client, params),
})
