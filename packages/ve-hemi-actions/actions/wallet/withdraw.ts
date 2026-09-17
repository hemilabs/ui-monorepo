import { EventEmitter } from 'events'
import { toPromiseEvent } from 'to-promise-event'
import {
  type Address,
  type TransactionReceipt,
  type WalletClient,
  encodeFunctionData,
} from 'viem'
import {
  readContract,
  waitForTransactionReceipt,
  writeContract,
} from 'viem/actions'

import { veHemiAbi } from '../../abi.ts'
import { getVeHemiContractAddress } from '../../constants.ts'
import { veHemiEpochRewardsFragments } from '../../epochRewardsFragments.ts'
import type { WithdrawEvents } from '../../types.ts'
import { validateWithdrawInputs } from '../../utils.ts'
import { getLockedBalance, getOwnerOf } from '../public/veHemi.ts'

// Withdrawing burns the veHEMI NFT, and veHEMI deletes the position's class bits with
// it. A position burned before its class was recorded can never be placed in one again,
// so every epoch it is owed becomes unpayable - silently, on a successful transaction.
//
// `capturePositionClass` is permissionless and idempotent, and exists so a product that
// lets users withdraw can call it on their behalf. This runs it, confirms it landed, and
// refuses the burn otherwise. Strictly ordered: never raced, never batched.
//
// Returns false when the caller must not proceed to the burn; the reason is already
// emitted by then.
const ensurePositionClassCaptured = async function ({
  account,
  emitter,
  rewardsAddress,
  tokenId,
  veHemiAddress,
  walletClient,
}: {
  account: Address
  emitter: EventEmitter<WithdrawEvents>
  rewardsAddress: Address
  tokenId: bigint
  veHemiAddress: Address
  walletClient: WalletClient
}) {
  // A rewards contract pays positions from exactly one veHEMI, and answers
  // `positionClass` for any id at all - `captured: false` for ids it has never heard of,
  // rather than reverting. On a scenario devnet it is bound to a mock whose ids are a
  // different space, so capturing there would record a stranger's class and block a
  // withdrawal that destroys nothing. Asking which veHEMI it tracks avoids a devnet
  // flag: the guard runs exactly when this contract could owe the position.
  const boundVeHemi = await readContract(walletClient, {
    abi: veHemiEpochRewardsFragments,
    address: rewardsAddress,
    functionName: 'veHemi',
  }).catch(() => undefined)

  if (boundVeHemi === undefined) {
    emitter.emit(
      'capture-position-class-failed',
      new Error('failed to read which veHEMI the rewards contract tracks'),
    )
    return false
  }

  if (boundVeHemi.toLowerCase() !== veHemiAddress.toLowerCase()) {
    // Not this contract's position. Burning it costs nothing here.
    return true
  }

  const readCaptured = () =>
    readContract(walletClient, {
      abi: veHemiEpochRewardsFragments,
      address: rewardsAddress,
      args: [tokenId],
      functionName: 'positionClass',
    }).then(([, , captured]) => captured)

  const before = await readCaptured().catch(() => undefined)

  if (before === undefined) {
    // Unknown is not captured. Refuse rather than risk the burn.
    emitter.emit(
      'capture-position-class-failed',
      new Error('failed to read the position class'),
    )
    return false
  }

  if (before) {
    return true
  }

  emitter.emit('pre-capture-position-class')

  const hash = await writeContract(walletClient, {
    abi: veHemiEpochRewardsFragments,
    account,
    address: rewardsAddress,
    args: [tokenId],
    chain: walletClient.chain,
    functionName: 'capturePositionClass',
  }).catch(function (error) {
    emitter.emit('user-signing-capture-position-class-error', error)
  })

  if (!hash) {
    return false
  }

  emitter.emit('user-signed-capture-position-class', hash)

  const receipt = await waitForTransactionReceipt(walletClient, {
    hash,
  }).catch(function (error) {
    emitter.emit('capture-position-class-failed', error)
  })

  if (!receipt) {
    return false
  }

  if (receipt.status !== 'success') {
    emitter.emit('capture-position-class-transaction-reverted', receipt)
    return false
  }

  // `capturePositionClass` reports its outcome in a return value, which a receipt cannot
  // carry, so a successful transaction is not evidence. Re-read it.
  const after = await readCaptured().catch(() => undefined)

  if (!after) {
    emitter.emit(
      'capture-position-class-failed',
      new Error('the position class is still not captured'),
    )
    return false
  }

  emitter.emit('capture-position-class-transaction-succeeded', receipt)
  return true
}

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
  epochRewardsAddress,
  tokenId,
  walletClient,
}: {
  account: Address
  // Required and nullable rather than optional, so a caller has to state which rewards
  // generation the chain is on. Optional would let a new call site burn positions on a
  // migrated chain by forgetting a parameter.
  epochRewardsAddress: Address | undefined
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

      // `undefined` means the continuous-accrual contract, where a burn destroys
      // nothing. Otherwise the class has to be on record before the NFT is burned.
      if (
        epochRewardsAddress &&
        !(await ensurePositionClassCaptured({
          account,
          emitter,
          rewardsAddress: epochRewardsAddress,
          tokenId,
          veHemiAddress,
          walletClient,
        }))
      ) {
        return
      }

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
