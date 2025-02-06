import { type Address, type Client } from 'viem'
import { writeContract } from 'viem/actions'

import {
  stakeManagerAbi,
  stakeManagerAddresses,
} from '../../contracts/stakeManager'

/**
 * Performs staking of an ERC-20 token by calling the `depositFor` function on the contract.
 *
 * @param {Client} client - The Viem client configured to interact with the blockchain.
 * @param {Object} parameters - The transaction parameters for staking.
 * @param {bigint} parameters.amount - The amount of tokens to be staked.
 * @param {Address} parameters.forAccount - The user's address initiating the staking.
 * @param {Address} parameters.tokenAddress - The ERC-20 token address being staked.
 *
 * @returns {Promise<Address>} - The transaction sent to the blockchain.
 */
export function stakeERC20Token(
  client: Client,
  parameters: {
    amount: bigint
    forAccount: Address
    tokenAddress: Address
  },
) {
  const { amount, forAccount, tokenAddress } = parameters
  return writeContract(client, {
    abi: stakeManagerAbi,
    account: forAccount,
    // @ts-expect-error: TS is complaining about client.chain!.id definition, but this works
    address: stakeManagerAddresses[client.chain!.id],
    args: [tokenAddress, forAccount, amount],
    // @ts-expect-error: TS is complaining about client.chain definition, but this works
    chain: client.chain,
    functionName: 'depositFor',
  })
}

/**
 * Performs staking of native ETH by calling the `depositETHFor` function on the contract.
 *
 * @param {Client} client - The Viem client configured to interact with the blockchain.
 * @param {Object} parameters - The transaction parameters for staking.
 * @param {bigint} parameters.amount - The amount of tokens to be staked.
 * @param {Address} parameters.forAccount - The user's address initiating the staking.
 *
 * @returns {Promise<Address>} - The transaction sent to the blockchain.
 */
export function stakeETHToken(
  client: Client,
  parameters: {
    amount: bigint
    forAccount: Address
  },
) {
  const { amount, forAccount } = parameters
  return writeContract(client, {
    abi: stakeManagerAbi,
    account: forAccount,
    // @ts-expect-error: TS is complaining about client.chain!.id definition, but this works
    address: stakeManagerAddresses[client.chain!.id],
    args: [forAccount],
    // @ts-expect-error: TS is complaining about client.chain definition, but this works
    chain: client.chain,
    functionName: 'depositETHFor',
    value: amount,
  })
}

/**
 * Unstakes a previously staked token by calling the `withdraw` function on the contract.
 *
 * @param {Client} client - The Viem client configured to interact with the blockchain.
 * @param {Object} parameters - The transaction parameters for unstaking.
 * @param {bigint} parameters.amount - The amount of tokens to be unstaked.
 * @param {Address} parameters.forAccount - The user's address initiating the unstaking.
 * @param {Address} parameters.tokenAddress - The token address to be unstaked.
 *
 * @returns {Promise<Address>} - The transaction sent to the blockchain.
 */
export function unstakeToken(
  client: Client,
  parameters: {
    amount: bigint
    forAccount: Address
    tokenAddress: Address
  },
) {
  const { amount, forAccount, tokenAddress } = parameters
  return writeContract(client, {
    abi: stakeManagerAbi,
    account: forAccount,
    // @ts-expect-error: TS is complaining about client.chain!.id definition, but this works
    address: stakeManagerAddresses[client.chain!.id],
    args: [tokenAddress, amount],
    // @ts-expect-error: TS is complaining about client.chain definition, but this works
    chain: client.chain,
    functionName: 'withdraw',
  })
}
