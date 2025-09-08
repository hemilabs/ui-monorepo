import { type Address, type Client } from 'viem'
import { readContract } from 'viem/actions'

import {
  stakeManagerAbi,
  stakeManagerAddresses,
} from '../../contracts/stakeManager'

/**
 * Retrieves the balance of a specific token for a given address.
 *
 * @param {Client} client - The Viem client used to read from the contract.
 * @param {Object} parameters - Query parameters.
 * @param {Address} parameters.tokenAddress - The address of the token to check.
 * @param {Address} parameters.address - The user address for which the balance will be returned.
 * @returns {Promise<bigint>} The token balance for the specified address.
 */
export function stakedBalance(
  client: Client,
  parameters: { tokenAddress: Address; address: Address },
) {
  const { address, tokenAddress } = parameters
  return readContract(client, {
    abi: stakeManagerAbi,
    address: stakeManagerAddresses[client.chain!.id],
    args: [tokenAddress, address],
    functionName: 'balance',
  })
}

/**
 * Checks whether a given token address is in the allowlist.
 *
 * @param {Client} client - The Viem client used to read from the contract.
 * @param {Object} parameters - Query parameters.
 * @param {Address} parameters.address - The token address to verify in the allowlist.
 * @returns {Promise<boolean>} True if the token is in the allowlist, otherwise false.
 */
export function stakeTokenAllowlist(
  client: Client,
  parameters: { address: Address },
) {
  const { address } = parameters
  return readContract(client, {
    abi: stakeManagerAbi,
    address: stakeManagerAddresses[client.chain!.id],
    args: [address],
    functionName: 'tokenAllowlist',
  })
}
