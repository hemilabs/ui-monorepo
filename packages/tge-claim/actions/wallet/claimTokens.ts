import { EventEmitter } from 'events'
import { hemi, hemiSepolia } from 'hemi-viem'
import {
  type Address,
  type WalletClient,
  type Hash,
  encodeFunctionData,
  isAddress,
  zeroAddress,
} from 'viem'
import { waitForTransactionReceipt, writeContract } from 'viem/actions'

import { tgeClaimAbi, getTgeClaimAddress } from '../../contracts/claimContract'
import { ClaimEvents, type LockupMonths } from '../../types/claim'
import { getEligibility } from '../../utils/getEligibility'
import { checkIsClaimable } from '../public/claimTokens'

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

// Check if user can claim tokens
const canClaim = async function ({
  account,
  amount,
  chainId,
  lockupMonths,
  ratio,
  walletClient,
}: {
  account: Address
  amount: bigint
  chainId: number
  lockupMonths: number
  ratio: number
  walletClient: WalletClient
}): Promise<{ canClaim: true } | { canClaim: false; reason: string }> {
  if (!isAddress(account)) {
    return { canClaim: false, reason: 'Invalid account address format' }
  }

  if (account === zeroAddress) {
    return { canClaim: false, reason: 'Account cannot be zero address' }
  }

  if (amount <= BigInt(0)) {
    return { canClaim: false, reason: 'Amount must be greater than zero' }
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

  // Check eligibility
  const eligibility = getEligibility(account)
  if (!eligibility) {
    return { canClaim: false, reason: 'Address is not eligible for claiming' }
  }

  // Validate amount against eligibility
  const maxClaimableAmount = BigInt(eligibility.amount)
  if (amount > maxClaimableAmount) {
    return {
      canClaim: false,
      reason: 'Amount exceeds maximum claimable allocation',
    }
  }

  return checkIsClaimable({
    account,
    amount,
    chainId,
    eligibility,
    walletClient,
  })
}

// Main claim function following the event-driven pattern
const runClaim = ({
  account,
  amount,
  lockupMonths,
  ratio,
  termsSignature,
  walletClient,
}: {
  account: Address
  amount: bigint
  lockupMonths: number
  ratio: number
  termsSignature: Hash
  walletClient: WalletClient
}) =>
  async function (emitter: EventEmitter<ClaimEvents>) {
    try {
      const claimResult = await canClaim({
        account,
        amount,
        chainId: walletClient.chain!.id,
        lockupMonths,
        ratio,
        walletClient,
      }).catch(() => ({
        canClaim: false as const,
        reason: 'Failed to validate claim inputs',
      }))

      if (!claimResult.canClaim) {
        // .reason is defined, but TS fails to detect it when compiling through next.
        // Using @ts-expect-error fails to compile so I need to use @ts-ignore
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
        emitter.emit('claim-failed-validation', claimResult.reason)
        return
      }

      // eligibility is guaranteed to exist here - already checked in canClaim
      const eligibility = getEligibility(account)!
      const { claimGroupId, proof } = eligibility

      emitter.emit('pre-claim')

      const contractAddress = getTgeClaimAddress(walletClient.chain!.id)

      // Using @ts-expect-error fails to compile so I need to use @ts-ignore
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
      const claimHash = await writeContract(walletClient, {
        abi: tgeClaimAbi,
        account,
        address: contractAddress,
        args: [
          BigInt(claimGroupId),
          account,
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
export const encodeClaimTokens = function ({
  account,
  amount,
  lockupMonths,
  ratio,
  termsSignature,
}: {
  account: Address
  amount: bigint
  lockupMonths: number
  ratio: number
  termsSignature: Hash
}) {
  const eligibility = getEligibility(account)

  if (!eligibility) {
    throw new Error('Address is not eligible for claiming')
  }

  // Validate amount
  if (amount <= BigInt(0)) {
    throw new Error('Amount must be greater than zero')
  }

  const maxClaimableAmount = BigInt(eligibility.amount)
  if (amount > maxClaimableAmount) {
    throw new Error('Amount exceeds maximum claimable allocation')
  }

  // Validate lockupMonths
  if (!validateLockupMonths(lockupMonths)) {
    throw new Error('Lockup months must be 6, 24, or 48')
  }

  // Validate ratio
  const ratioValidation = validateRatio(ratio)
  if (ratioValidation) {
    throw new Error(ratioValidation.reason)
  }

  const { claimGroupId, proof } = eligibility

  return encodeFunctionData({
    abi: tgeClaimAbi,
    args: [
      BigInt(claimGroupId),
      account,
      amount,
      proof,
      lockupMonths,
      formatRatio(ratio),
      termsSignature,
    ],
    functionName: 'claim',
  })
}

// Main export function
export const claimTokens = function (...args: Parameters<typeof runClaim>) {
  const emitter = new EventEmitter<ClaimEvents>()
  const promise = Promise.resolve().then(() => runClaim(...args)(emitter))

  return { emitter, promise }
}
