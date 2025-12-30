import EventEmitter from 'events'
import { toPromiseEvent } from 'to-promise-event'
import type { Address, Hash, WalletClient } from 'viem'
import { encodeFunctionData, isAddress } from 'viem'
import { writeContract } from 'viem/actions'
import { waitForTransactionReceipt } from 'viem/actions'

import { distributorAbi } from '../../abi'
import type { ClaimAllRewardsEvents, ClaimReward } from '../../types'

type ClaimAllRewardsParams = ClaimReward & {
  client: WalletClient
  distributorAddress: Address
}

const validateAddresses = function ({
  account,
  distributorAddress,
  tokens,
  users,
}: {
  account: Address
  distributorAddress: Address
  tokens: Address[]
  users: Address[]
}) {
  if (!distributorAddress) {
    return {
      isValid: false,
      reason: 'Distributor address is required',
    }
  }
  if (!isAddress(distributorAddress, { strict: false })) {
    return {
      isValid: false,
      reason: 'Distributor address is not a valid address',
    }
  }
  if (!account) {
    return {
      isValid: false,
      reason: 'Client is not defined',
    }
  }
  if (!isAddress(account, { strict: false })) {
    return {
      isValid: false,
      reason: 'Account is not a valid address',
    }
  }
  if (users.some(user => !isAddress(user, { strict: false }))) {
    return {
      isValid: false,
      reason: 'All user addresses must be valid',
    }
  }
  if (tokens.some(token => !isAddress(token, { strict: false }))) {
    return {
      isValid: false,
      reason: 'All token addresses must be valid',
    }
  }
  return { isValid: true }
}

const validateClaimAllRewardsInputs = async function ({
  account,
  amounts,
  distributorAddress,
  proofs,
  tokens,
  users,
}: Omit<ClaimAllRewardsParams, 'client'>): Promise<{
  canClaim: boolean
  reason?: string
}> {
  if (users.length === 0) {
    return {
      canClaim: false,
      reason: 'At least one user is required',
    }
  }
  if (users.length !== tokens.length) {
    return {
      canClaim: false,
      reason: 'Users and tokens arrays must have the same length',
    }
  }
  if (users.length !== amounts.length) {
    return {
      canClaim: false,
      reason: 'Users and amounts arrays must have the same length',
    }
  }
  if (users.length !== proofs.length) {
    return {
      canClaim: false,
      reason: 'Users and proofs arrays must have the same length',
    }
  }

  const addressValidity = validateAddresses({
    account,
    distributorAddress,
    tokens,
    users,
  })

  if (!addressValidity.isValid) {
    return {
      canClaim: addressValidity.isValid,
      reason: addressValidity.reason,
    }
  }

  return { canClaim: true }
}

const runClaimAllRewards = ({
  account,
  amounts,
  client,
  distributorAddress,
  proofs,
  tokens,
  users,
}: ClaimAllRewardsParams) =>
  async function (emitter: EventEmitter<ClaimAllRewardsEvents>) {
    try {
      const { canClaim, reason } = await validateClaimAllRewardsInputs({
        account,
        amounts,
        distributorAddress,
        proofs,
        tokens,
        users,
      }).catch(() => ({
        canClaim: false,
        reason: 'failed to validate inputs',
      }))

      if (!canClaim) {
        emitter.emit('claim-all-rewards-failed-validation', reason!)
        return
      }

      emitter.emit('pre-claim-all-rewards')

      const hash = await writeContract(client, {
        abi: distributorAbi,
        account,
        address: distributorAddress,
        args: [users, tokens, amounts, proofs],
        chain: client.chain,
        functionName: 'claim',
      }).catch(function (error: Error) {
        emitter.emit('user-signing-claim-all-rewards-error', error)
      })

      if (!hash) {
        return
      }

      emitter.emit('user-signed-claim-all-rewards', hash)

      const receipt = await waitForTransactionReceipt(client, { hash })

      if (receipt.status === 'success') {
        emitter.emit('claim-all-rewards-transaction-succeeded', receipt)
      } else {
        emitter.emit('claim-all-rewards-transaction-reverted', receipt)
      }
    } catch (error) {
      emitter.emit('claim-all-rewards-failed', error as Error)
    } finally {
      emitter.emit('claim-all-rewards-settled')
    }
  }

/**
 * Claims multiple rewards in a single transaction from a Merkl distributor contract.
 *
 * @param params - The parameters for claiming rewards
 * @param params.account - The account address claiming the rewards
 * @param params.amounts - Array of reward amounts to claim
 * @param params.client - The wallet client to use for the transaction
 * @param params.distributorAddress - Address of the Merkl distributor contract
 * @param params.proofs - Array of merkle proofs for each reward
 * @param params.tokens - Array of token addresses being claimed
 * @param params.users - Array of user addresses (typically all the same as account)
 * @returns Object containing promise that resolves when operation completes and event emitter for progress tracking
 */
export const claimAllRewards = (
  ...args: Parameters<typeof runClaimAllRewards>
) => toPromiseEvent<ClaimAllRewardsEvents>(runClaimAllRewards(...args))

/**
 * Encodes the claim transaction data for gas estimation.
 *
 * @param params - The parameters for encoding the claim transaction
 * @param params.amounts - Array of reward amounts to claim
 * @param params.proofs - Array of merkle proofs for each reward
 * @param params.tokens - Array of token addresses being claimed
 * @param params.users - Array of user addresses
 * @returns Encoded transaction data as hex string
 */
export const encodeClaimAllRewards = ({
  amounts,
  proofs,
  tokens,
  users,
}: {
  amounts: bigint[]
  proofs: Hash[][]
  tokens: Address[]
  users: Address[]
}) =>
  encodeFunctionData({
    abi: distributorAbi,
    args: [users, tokens, amounts, proofs],
    functionName: 'claim',
  })
