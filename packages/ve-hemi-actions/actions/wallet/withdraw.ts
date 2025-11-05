import { EventEmitter } from 'events'
import { toPromiseEvent } from 'to-promise-event'
import type { Address, TransactionReceipt, WalletClient } from 'viem'
import { encodeFunctionData } from 'viem'
import { waitForTransactionReceipt, writeContract } from 'viem/actions'

import { veHemiAbi } from '../../abi'
import { getVeHemiContractAddress } from '../../constants'
import type { WithdrawEvents } from '../../types'
import { validateWithdrawInputs } from '../../utils'
import { getLockedBalance, getOwnerOf } from '../public/veHemi'

const canRunWithdraw = async function ({
  account,
  tokenId,
  walletClient,
}: {
  account: Address
  tokenId: bigint
  walletClient: WalletClient
}): Promise<{
  canWithdraw: boolean
  reason?: string
}> {
  if (!walletClient.chain) {
    return {
      canWithdraw: false,
      reason: 'wallet client chain is not defined',
    }
  }

  const reason = validateWithdrawInputs({
    account,
    chainId: walletClient.chain.id,
    tokenId,
  })
  if (reason) {
    return { canWithdraw: false, reason }
  }

  try {
    // Check if lock exists and is expired and if the account is the owner
    const [{ amount, end }, owner] = await Promise.all([
      getLockedBalance(walletClient, tokenId),
      getOwnerOf(walletClient, tokenId),
    ])

    if (owner.toLowerCase() !== account.toLowerCase()) {
      return { canWithdraw: false, reason: 'not token owner' }
    }

    if (amount <= 0) {
      return { canWithdraw: false, reason: 'no existing lock' }
    }

    const now = BigInt(Math.floor(Date.now() / 1000))
    if (end > now) {
      return { canWithdraw: false, reason: 'lock not yet expired' }
    }

    return { canWithdraw: true }
  } catch {
    return { canWithdraw: false, reason: 'failed to check lock status' }
  }
}

const runWithdraw = ({
  account,
  tokenId,
  walletClient,
}: {
  account: Address
  tokenId: bigint
  walletClient: WalletClient
}) =>
  async function (emitter: EventEmitter<WithdrawEvents>) {
    try {
      const { canWithdraw, reason } = await canRunWithdraw({
        account,
        tokenId,
        walletClient,
      }).catch(() => ({
        canWithdraw: false,
        reason: 'failed to validate inputs',
      }))

      if (!canWithdraw) {
        emitter.emit('withdraw-failed-validation', reason!)
        return
      }

      const veHemiAddress = getVeHemiContractAddress(walletClient.chain!.id)

      emitter.emit('pre-withdraw')

      const withdrawHash = await writeContract(walletClient, {
        abi: veHemiAbi,
        account,
        address: veHemiAddress,
        args: [tokenId],
        chain: walletClient.chain,
        functionName: 'withdraw',
      }).catch(function (error) {
        emitter.emit('user-signing-withdraw-error', error)
      })

      if (!withdrawHash) {
        return
      }

      emitter.emit('user-signed-withdraw', withdrawHash)

      const withdrawReceipt = await waitForTransactionReceipt(walletClient, {
        hash: withdrawHash,
      }).catch(function (error) {
        emitter.emit('withdraw-failed', error)
      })

      if (!withdrawReceipt) {
        return
      }

      const withdrawEventMap: Record<
        TransactionReceipt['status'],
        keyof WithdrawEvents
      > = {
        reverted: 'withdraw-transaction-reverted',
        success: 'withdraw-transaction-succeeded',
      }

      emitter.emit(withdrawEventMap[withdrawReceipt.status], withdrawReceipt)
    } catch (error) {
      emitter.emit('unexpected-error', error as Error)
    } finally {
      emitter.emit('withdraw-settled')
    }
  }

export const withdraw = (...args: Parameters<typeof runWithdraw>) =>
  toPromiseEvent<WithdrawEvents>(runWithdraw(...args))

/**
 * Encode the withdraw function call for batch operations
 */
export const encodeWithdraw = ({ tokenId }: { tokenId: bigint }) =>
  encodeFunctionData({
    abi: veHemiAbi,
    args: [tokenId],
    functionName: 'withdraw',
  })
