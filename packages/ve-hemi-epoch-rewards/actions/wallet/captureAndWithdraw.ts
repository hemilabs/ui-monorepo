import { EventEmitter } from 'events'
import { toPromiseEvent } from 'to-promise-event'
import {
  isAddress,
  isAddressEqual,
  type Address,
  type TransactionReceipt,
  type WalletClient,
} from 'viem'
import { readContract, simulateContract, writeContract } from 'viem/actions'

import { getVeHemiEpochRewardsContractAddress } from '../../constants.ts'
import { veHemiEpochRewardsAbi } from '../../rewardsAbi.ts'
import type { CaptureAndWithdrawEvents } from '../../types.ts'
import { veHemiFragments } from '../../veHemiFragments.ts'

import { waitForSettlement } from './waitForSettlement.ts'

type CaptureAndWithdrawParameters = {
  account: Address
  tokenId: bigint
  veHemiAddress: Address
  walletClient: WalletClient
}

/**
 * Records the position's class with the epoch rewards contract before withdrawal
 * If not, rewards won't be claimable after.
 */
// Neither outcome burned anything, and they are not the same event: cancelling is the
// holder's decision, the same one as rejecting the prompt, while a substituted
// transaction is a failure.
const reportWithdrawReplacement = function (
  emitter: EventEmitter<CaptureAndWithdrawEvents>,
  outcome: 'cancelled' | 'replaced',
) {
  if (outcome === 'cancelled') {
    emitter.emit(
      'user-signing-withdraw-error',
      new Error('the withdraw transaction was cancelled from the wallet'),
    )
    return
  }
  emitter.emit(
    'withdraw-failed',
    new Error(
      'the withdraw transaction was replaced from the wallet and burned nothing',
    ),
  )
}

const capturePositionClass = async function ({
  account,
  emitter,
  tokenId,
  veHemiAddress,
  walletClient,
}: CaptureAndWithdrawParameters & {
  emitter: EventEmitter<CaptureAndWithdrawEvents>
}) {
  const contract = {
    abi: veHemiEpochRewardsAbi,
    address: getVeHemiEpochRewardsContractAddress(walletClient.chain!.id),
  } as const

  const boundVeHemi = await readContract(walletClient, {
    ...contract,
    functionName: 'veHemi',
  })

  if (!isAddressEqual(boundVeHemi, veHemiAddress)) {
    emitter.emit('capture-not-needed')
    return undefined
  }

  const [, , captured] = await readContract(walletClient, {
    ...contract,
    args: [tokenId],
    functionName: 'positionClass',
  })

  if (captured) {
    emitter.emit('capture-not-needed')
    return undefined
  }

  const { result } = await simulateContract(walletClient, {
    ...contract,
    account,
    args: [tokenId],
    chain: walletClient.chain,
    functionName: 'capturePositionClass',
  })

  if (!result) {
    return 'the position class cannot be captured'
  }

  emitter.emit('pre-capture')

  const hash = await writeContract(walletClient, {
    ...contract,
    account,
    args: [tokenId],
    chain: walletClient.chain,
    functionName: 'capturePositionClass',
  }).catch(function (error) {
    emitter.emit('user-signing-capture-error', error)
    return undefined
  })

  if (!hash) {
    return 'the position class capture was not signed'
  }

  emitter.emit('user-signed-capture', hash)

  const settlement = await waitForSettlement(walletClient, hash).catch(
    function (error) {
      emitter.emit('user-signing-capture-error', error as Error)
      return undefined
    },
  )

  if (!settlement) {
    return 'waiting for the position class capture failed'
  }

  // A cancelled or substituted capture recorded nothing. The capture step is already
  // showing as pending, so it needs a terminal event of its own or it spins for ever.
  // `user-signing-capture-error` is the state a refused prompt already reaches.
  if (settlement.outcome !== 'settled') {
    const reason =
      settlement.outcome === 'cancelled'
        ? 'the position class capture was cancelled from the wallet'
        : 'the position class capture was replaced from the wallet'
    emitter.emit('user-signing-capture-error', new Error(reason))
    return reason
  }

  const { receipt } = settlement

  if (receipt.status !== 'success') {
    emitter.emit('capture-transaction-reverted', receipt)
    return 'capturing the position class was reverted'
  }

  emitter.emit('capture-transaction-succeeded', receipt)

  const [, , capturedNow] = await readContract(walletClient, {
    ...contract,
    args: [tokenId],
    functionName: 'positionClass',
  })

  return capturedNow ? undefined : 'the position class was not captured'
}

const runCaptureAndWithdraw = ({
  account,
  tokenId,
  veHemiAddress,
  walletClient,
}: CaptureAndWithdrawParameters) =>
  async function (emitter: EventEmitter<CaptureAndWithdrawEvents>) {
    try {
      if (!walletClient.chain) {
        emitter.emit(
          'withdraw-failed-validation',
          'wallet client chain is not defined',
        )
        return
      }
      if (!isAddress(account) || !isAddress(veHemiAddress)) {
        emitter.emit(
          'withdraw-failed-validation',
          'account is not a valid address',
        )
        return
      }

      const refusal = await capturePositionClass({
        account,
        emitter,
        tokenId,
        veHemiAddress,
        walletClient,
      }).catch(() => 'failed to capture the position class')

      if (refusal) {
        emitter.emit('withdraw-failed-validation', refusal)
        return
      }

      const burn = {
        abi: veHemiFragments,
        account,
        address: veHemiAddress,
        args: [tokenId],
        chain: walletClient.chain,
        functionName: 'withdraw',
      } as const

      // The lock rules live in veHEMI, so they are asked of it rather than repeated
      // here: a position that is not the caller's, or whose lock has not expired,
      // reverts in the simulation before anyone is asked to sign.
      const simulation = await simulateContract(walletClient, burn).catch(
        function (error) {
          emitter.emit('withdraw-failed', error)
        },
      )

      if (!simulation) {
        return
      }

      emitter.emit('pre-withdraw')

      const withdrawHash = await writeContract(walletClient, burn).catch(
        function (error) {
          emitter.emit('user-signing-withdraw-error', error)
        },
      )

      if (!withdrawHash) {
        return
      }

      emitter.emit('user-signed-withdraw', withdrawHash)

      const withdrawSettlement = await waitForSettlement(
        walletClient,
        withdrawHash,
      ).catch(function (error) {
        emitter.emit('withdraw-failed', error as Error)
      })

      if (!withdrawSettlement) {
        return
      }

      // Nothing was burned. Reporting this as a completed withdraw marks the position
      // withdrawn and drops it out of the table while it still exists on chain.
      if (withdrawSettlement.outcome !== 'settled') {
        reportWithdrawReplacement(emitter, withdrawSettlement.outcome)
        return
      }

      const withdrawReceipt = withdrawSettlement.receipt

      const withdrawEventMap: Record<
        TransactionReceipt['status'],
        keyof CaptureAndWithdrawEvents
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

export const captureAndWithdraw = (
  ...args: Parameters<typeof runCaptureAndWithdraw>
) => toPromiseEvent<CaptureAndWithdrawEvents>(runCaptureAndWithdraw(...args))
