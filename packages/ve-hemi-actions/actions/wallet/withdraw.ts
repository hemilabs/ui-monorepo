import { EventEmitter } from 'events'
import type { Address, TransactionReceipt, WalletClient } from 'viem'
import { encodeFunctionData } from 'viem'
import { waitForTransactionReceipt, writeContract } from 'viem/actions'

import { veHemiAbi } from '../../abi'
import { getVeHemiContractAddress } from '../../constants'
import type { WithdrawEvents } from '../../types'
import { toPromiseEvent, validateWithdrawInputs } from '../../utils'
import { getLockedBalance } from '../public/veHemi'

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
    // Check if lock exists and is expired
    const { amount, end } = await getLockedBalance(walletClient, tokenId)
    const now = BigInt(Math.floor(Date.now() / 1000))

    if (amount <= 0) {
      return { canWithdraw: false, reason: 'no existing lock' }
    }

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

      // Using @ts-expect-error fails to compile so I need to use @ts-ignore
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
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

      // Using @ts-expect-error fails to compile so I need to use @ts-ignore
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
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
