import { EventEmitter } from 'events'
import { hemi, hemiSepolia } from 'hemi-viem'
import {
  type WalletClient,
  encodeFunctionData,
  isAddress,
  zeroAddress,
  isHex,
  type Hex,
} from 'viem'
import { waitForTransactionReceipt, writeContract } from 'viem/actions'

import { merkleBoxAbi, getMerkleBoxAddress } from '../../contracts/merkleBox'
import {
  ClaimEvents,
  EligibilityData,
  type LockupMonths,
} from '../../types/claim'
import { checkIsClaimable } from '../public/merkleBox'

// Validation functions
const validateLockupMonths = (
  lockupMonths: number,
): lockupMonths is LockupMonths => [6, 24, 48].includes(lockupMonths)

const validateRatio = function (
  ratio: number,
): { canClaim: false; reason: string } | undefined {
  // Validate that ratio is a number and finite
  if (typeof ratio !== 'number' || !Number.isFinite(ratio)) {
    return { canClaim: false, reason: 'Ratio must be a finite number' }
  }

  if (ratio < 50 || ratio > 100) {
    return { canClaim: false, reason: 'Ratio must be between 50 and 100' }
  }

  return undefined
}

const formatRatio = function (ratio: number) {
  // Round to 2 decimal places and convert to contract format (multiply by 100)
  // So for example a ratio of 65.75 should become BigInt(6575)
  const roundedRatio = Math.round(ratio * 100) / 100
  return BigInt(Math.round(roundedRatio * 100))
}

const isProofValid = (proof: unknown): proof is Hex[] =>
  !!proof &&
  Array.isArray(proof) &&
  proof.length > 0 &&
  proof.every(p => isHex(p))

const isClaimGroupIdValid = (claimGroupId: unknown): claimGroupId is number =>
  typeof claimGroupId === 'number' && claimGroupId >= 0

// Check if user can claim tokens
const canClaim = async function ({
  address,
  amount,
  chainId,
  claimGroupId,
  lockupMonths,
  proof,
  ratio,
  walletClient,
}: EligibilityData & {
  chainId: number
  lockupMonths: number
  ratio: number
  walletClient: WalletClient
}): Promise<{ canClaim: true } | { canClaim: false; reason: string }> {
  if (!isAddress(address)) {
    return { canClaim: false, reason: 'Invalid account address format' }
  }

  if (address === zeroAddress) {
    return { canClaim: false, reason: 'Account cannot be zero address' }
  }

  if (amount <= BigInt(0)) {
    return { canClaim: false, reason: 'Amount must be greater than zero' }
  }

  if (!isClaimGroupIdValid(claimGroupId)) {
    return { canClaim: false, reason: 'Invalid claim group ID' }
  }

  if (!validateLockupMonths(lockupMonths)) {
    return {
      canClaim: false,
      reason: 'Lockup months must be 6, 24, or 48',
    }
  }

  // Validate ratio
  const ratioValidation = validateRatio(ratio)
  if (ratioValidation) {
    return ratioValidation
  }

  // Validate chainId - only Hemi networks are supported
  if (chainId !== hemi.id && chainId !== hemiSepolia.id) {
    return {
      canClaim: false,
      reason: 'Invalid chain ID - only Hemi networks are supported',
    }
  }

  if (!isProofValid(proof)) {
    return {
      canClaim: false,
      reason: 'Invalid proof format',
    }
  }

  return checkIsClaimable({
    address,
    amount,
    chainId,
    claimGroupId,
    client: walletClient,
    proof,
  })
}

// Main claim function following the event-driven pattern
const runClaim = ({
  address,
  amount,
  claimGroupId,
  lockupMonths,
  proof,
  ratio,
  termsSignature,
  walletClient,
}: EligibilityData & {
  lockupMonths: number
  ratio: number
  termsSignature: Hex
  walletClient: WalletClient
}) =>
  async function (emitter: EventEmitter<ClaimEvents>) {
    try {
      const claimResult = await canClaim({
        address,
        amount,
        chainId: walletClient.chain!.id,
        claimGroupId,
        lockupMonths,
        proof,
        ratio,
        walletClient,
      }).catch(() => ({
        canClaim: false as const,
        reason: 'Failed to validate claim inputs',
      }))

      if (!claimResult.canClaim) {
        // .reason is defined, but TS fails to detect it when compiling through next.
        const { reason } = claimResult as { reason: string }
        emitter.emit('claim-failed-validation', reason)
        return
      }

      emitter.emit('pre-claim')

      const contractAddress = getMerkleBoxAddress(walletClient.chain!.id)

      // Using @ts-expect-error fails to compile so I need to use @ts-ignore
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
      const claimHash = await writeContract(walletClient, {
        abi: merkleBoxAbi,
        account: address,
        address: contractAddress,
        args: [
          BigInt(claimGroupId),
          address,
          amount,
          proof,
          lockupMonths,
          formatRatio(ratio),
          termsSignature,
        ],
        chain: walletClient.chain,
        functionName: 'claim',
      }).catch(function (error) {
        emitter.emit('user-signing-claim-error', error)
      })

      if (!claimHash) {
        return
      }

      emitter.emit('user-signed-claim', claimHash)

      // Using @ts-expect-error fails to compile so I need to use @ts-ignore
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
      const receipt = await waitForTransactionReceipt(walletClient, {
        hash: claimHash,
      })

      if (receipt.status === 'success') {
        emitter.emit('claim-transaction-succeeded', receipt)
      } else {
        emitter.emit('claim-transaction-reverted', receipt)
      }
    } catch (error) {
      emitter.emit('unexpected-error', error as Error)
    } finally {
      emitter.emit('claim-settled')
    }
  }

// Encode claim function data for gas estimation
export const encodeClaimTokens = ({
  address,
  amount,
  claimGroupId,
  lockupMonths,
  proof,
  ratio,
  termsSignature,
}: EligibilityData & {
  lockupMonths: number
  ratio: number
  termsSignature: Hex
}) =>
  encodeFunctionData({
    abi: merkleBoxAbi,
    args: [
      BigInt(claimGroupId),
      address,
      amount,
      proof,
      lockupMonths,
      formatRatio(ratio),
      termsSignature,
    ],
    functionName: 'claim',
  })

// Main export function
export const claimTokens = function (...args: Parameters<typeof runClaim>) {
  const emitter = new EventEmitter<ClaimEvents>()
  const promise = Promise.resolve().then(() => runClaim(...args)(emitter))

  return { emitter, promise }
}
