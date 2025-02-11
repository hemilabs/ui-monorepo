import { type Client } from 'viem'

import {
  stakedBalance,
  stakeTokenAllowlist,
} from './actions/public/stakeManager'
import {
  stakeERC20Token,
  stakeETHToken,
  unstakeToken,
} from './actions/wallet/stakeManager'

/**
 * Extends a Viem `Client` with staking-related public actions.
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

/**
 * Extends a Viem `Client` with staking-related wallet actions.
 *
 * @param {Object} options - Additional configuration options.
 * @returns {Function} A function that extends the Viem `Client`.
 */
export const hemiWalletStakeActions = () => (client: Client) => ({
  stakeERC20Token: (params: Parameters<typeof stakeERC20Token>[1]) =>
    stakeERC20Token(client, params),
  stakeETHToken: (params: Parameters<typeof stakeETHToken>[1]) =>
    stakeETHToken(client, params),
  unstakeToken: (params: Parameters<typeof unstakeToken>[1]) =>
    unstakeToken(client, params),
})
