import { EventEmitter } from 'events'
import { toPromiseEvent } from 'to-promise-event'
import type { Address, TransactionReceipt, WalletClient } from 'viem'
import {
  encodeFunctionData,
  isAddress,
  isAddressEqual,
  zeroAddress,
} from 'viem'
import {
  getBalance,
  waitForTransactionReceipt,
  writeContract,
} from 'viem/actions'

import { poolRewardsAbi } from '../../abi'
import type { ClaimRewardEvents } from '../../types'

const canRunClaimReward = async function ({
  account,
  vaultRewardsAddress,
  walletClient,
}: {
  account: Address
  vaultRewardsAddress: Address
  walletClient: WalletClient
}): Promise<{
  canClaim: boolean
  reason?: string
}> {
  if (!walletClient.chain) {
    return {
      canClaim: false,
      reason: 'wallet client chain is not defined',
    }
  }

  // Validate addresses
  if (!isAddress(vaultRewardsAddress)) {
    return { canClaim: false, reason: 'invalid contract address provided' }
  }

  if (isAddressEqual(vaultRewardsAddress, zeroAddress)) {
    return {
      canClaim: false,
      reason: 'contract address cannot be zero address',
    }
  }

  if (!isAddress(account)) {
    return { canClaim: false, reason: 'invalid account address provided' }
  }

  if (isAddressEqual(account, zeroAddress)) {
    return { canClaim: false, reason: 'account address cannot be zero address' }
  }

  try {
    // Check if account has enough native token balance for gas
    const balance = await getBalance(walletClient, { address: account })

    // Check if the user has non-zero balance
    if (balance === BigInt(0)) {
      return {
        canClaim: false,
        reason: 'insufficient native token balance for gas fees',
      }
    }

    return { canClaim: true }
  } catch {
    return { canClaim: false, reason: 'failed to check account balance' }
  }
}

const runClaimReward = ({
  account,
  vaultRewardsAddress,
  walletClient,
}: {
  account: Address
  vaultRewardsAddress: Address
  walletClient: WalletClient
}) =>
  async function (emitter: EventEmitter<ClaimRewardEvents>) {
    try {
      if (!walletClient.chain) {
        throw new Error('Chain is not defined on wallet')
      }

      if (!walletClient.account) {
        throw new Error('Account is not defined on wallet')
      }

      const { canClaim, reason } = await canRunClaimReward({
        account,
        vaultRewardsAddress,
        walletClient,
      }).catch(() => ({
        canClaim: false,
        reason: 'failed to validate inputs',
      }))

      if (!canClaim) {
        emitter.emit('claim-reward-failed-validation', reason!)
        return
      }

      emitter.emit('pre-claim-reward')

      const claimRewardHash = await writeContract(walletClient, {
        abi: poolRewardsAbi,
        account,
        address: vaultRewardsAddress,
        args: [account],
        chain: walletClient.chain,
        functionName: 'claimReward',
      }).catch(function (error) {
        emitter.emit('user-signing-claim-reward-error', error)
      })

      if (!claimRewardHash) {
        return
      }

      emitter.emit('user-signed-claim-reward', claimRewardHash)

      const claimRewardReceipt = await waitForTransactionReceipt(walletClient, {
        hash: claimRewardHash,
      }).catch(function (error) {
        emitter.emit('claim-reward-failed', error)
      })

      if (!claimRewardReceipt) {
        return
      }

      const claimEventMap: Record<
        TransactionReceipt['status'],
        keyof ClaimRewardEvents
      > = {
        reverted: 'claim-reward-transaction-reverted',
        success: 'claim-reward-transaction-succeeded',
      }

      emitter.emit(claimEventMap[claimRewardReceipt.status], claimRewardReceipt)
    } catch (error) {
      emitter.emit('unexpected-error', error as Error)
    } finally {
      emitter.emit('claim-reward-settled')
    }
  }

export const claimReward = (...args: Parameters<typeof runClaimReward>) =>
  toPromiseEvent<ClaimRewardEvents>(runClaimReward(...args))

export const encodeClaimReward = ({ account }: { account: Address }) =>
  encodeFunctionData({
    abi: poolRewardsAbi,
    args: [account],
    functionName: 'claimReward',
  })
