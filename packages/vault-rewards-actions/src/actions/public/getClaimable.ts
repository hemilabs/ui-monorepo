import type { Address, Client } from 'viem'
import { isAddress, isAddressEqual, zeroAddress } from 'viem'
import { readContract } from 'viem/actions'

import { poolRewardsAbi } from '../../abi'

/**
 * Retrieves the claimable rewards for a specific account from a pool rewards contract.
 *
 * @param client - The viem client instance
 * @param params - Parameters for the function
 * @param params.account - The account address to check claimable rewards for
 * @param params.vaultRewardsAddress - The pool rewards contract address
 *
 * @returns A promise that resolves to a tuple containing:
 * - `_rewardTokens`: Array of reward token addresses. It's the first element of the tuple.
 * - `_claimableAmounts`: Array of claimable amounts for each reward token. It's the second element of the tuple.
 *
 * The arrays have the same length, where each index corresponds to a reward token
 * and its claimable amount. For example, if `_rewardTokens[0]` is token A's address,
 * then `_claimableAmounts[0]` is the claimable amount for token A.
 */
export const getClaimable = function (
  client: Client,
  {
    account,
    vaultRewardsAddress,
  }: {
    account: Address
    vaultRewardsAddress: Address
  },
) {
  if (!client) {
    throw new Error('Client is required')
  }

  if (!client.chain) {
    throw new Error('Public client chain is not defined')
  }

  if (!isAddress(vaultRewardsAddress)) {
    throw new Error('Invalid contract address provided')
  }

  if (isAddressEqual(vaultRewardsAddress, zeroAddress)) {
    throw new Error('Contract address cannot be zero address')
  }

  if (!isAddress(account)) {
    throw new Error('Invalid account address provided')
  }

  if (isAddressEqual(account, zeroAddress)) {
    throw new Error('Account address cannot be zero address')
  }

  return readContract(client, {
    abi: poolRewardsAbi,
    address: vaultRewardsAddress,
    args: [account],
    functionName: 'claimable',
  })
}
