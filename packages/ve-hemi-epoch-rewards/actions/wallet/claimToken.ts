import { EventEmitter } from 'events'
import { toPromiseEvent } from 'to-promise-event'
import { type Address, type TransactionReceipt, type WalletClient } from 'viem'
import { simulateContract, writeContract } from 'viem/actions'

import { getVeHemiEpochRewardsContractAddress } from '../../constants.ts'
import { veHemiEpochRewardsAbi } from '../../rewardsAbi.ts'
import type { ClaimTokenEvents } from '../../types.ts'
import { validateClaimTokenInputs } from '../../utils.ts'

import { waitForSettlement } from './waitForSettlement.ts'

type ClaimTokenParameters = {
  account: Address
  fromEpoch: number
  toEpoch: number
  token: Address
  tokenId: bigint
  walletClient: WalletClient
}

/**
 * Settles ONE reward token for a position, over a range of epochs.
 */
const runClaimToken = ({
  account,
  fromEpoch,
  toEpoch,
  token,
  tokenId,
  walletClient,
}: ClaimTokenParameters) =>
  async function (emitter: EventEmitter<ClaimTokenEvents>) {
    try {
      if (!walletClient.chain) {
        emitter.emit(
          'claim-token-failed-validation',
          'wallet client chain is not defined',
        )
        return
      }

      const reason = validateClaimTokenInputs({
        account,
        fromEpoch,
        toEpoch,
        token,
        tokenId,
      })
      if (reason) {
        emitter.emit('claim-token-failed-validation', reason)
        return
      }

      const claim = {
        abi: veHemiEpochRewardsAbi,
        account,
        address: getVeHemiEpochRewardsContractAddress(walletClient.chain.id),
        args: [tokenId, account, token, fromEpoch, toEpoch],
        chain: walletClient.chain,
        functionName: 'claimToken',
      } as const

      // The contract answers for the exact call about to be signed: a pause, an
      // unregistered token, a range wider than `MAX_CLAIM_EPOCHS`, or the reverting
      // transfer this action exists to route around, all surface here rather than
      // after a signature.
      const simulation = await simulateContract(walletClient, claim).catch(
        function (error) {
          emitter.emit('claim-token-failed', error)
        },
      )

      if (!simulation) {
        return
      }

      emitter.emit('pre-claim-token')

      const claimHash = await writeContract(walletClient, claim).catch(
        function (error) {
          emitter.emit('user-signing-claim-token-error', error)
        },
      )

      if (!claimHash) {
        return
      }

      emitter.emit('user-signed-claim-token', claimHash)

      const settlement = await waitForSettlement(walletClient, claimHash).catch(
        function (error) {
          emitter.emit('claim-token-failed', error as Error)
        },
      )

      if (!settlement) {
        return
      }

      // Same rule as the whole-registry claim: a wallet-side cancel is the holder's
      // decision, a wallet-side replacement is a failure, and neither settled anything.
      if (settlement.outcome !== 'settled') {
        if (settlement.outcome === 'cancelled') {
          emitter.emit(
            'user-signing-claim-token-error',
            new Error('the claim transaction was cancelled from the wallet'),
          )
        } else {
          emitter.emit(
            'claim-token-failed',
            new Error(
              'the claim transaction was replaced from the wallet and settled no epochs',
            ),
          )
        }
        return
      }

      const claimReceipt = settlement.receipt

      const claimEventMap: Record<
        TransactionReceipt['status'],
        keyof ClaimTokenEvents
      > = {
        reverted: 'claim-token-transaction-reverted',
        success: 'claim-token-transaction-succeeded',
      }

      emitter.emit(claimEventMap[claimReceipt.status], claimReceipt)
    } catch (error) {
      emitter.emit('unexpected-error', error as Error)
    } finally {
      emitter.emit('claim-token-settled')
    }
  }

export const claimToken = (...args: Parameters<typeof runClaimToken>) =>
  toPromiseEvent<ClaimTokenEvents>(runClaimToken(...args))
