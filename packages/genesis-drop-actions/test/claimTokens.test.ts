import { hemi, hemiSepolia } from 'hemi-viem'
import {
  type WalletClient,
  type TransactionReceipt,
  zeroAddress,
  zeroHash,
} from 'viem'
import {
  readContract,
  waitForTransactionReceipt,
  writeContract,
} from 'viem/actions'
import { describe, it, expect, vi } from 'vitest'

import { claimTokens } from '../actions/wallet/merkleBox'
import { getMerkleBoxAddress } from '../contracts/merkleBox'

// Mock all external dependencies
vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}))

vi.mock('../contracts/merkleBox', async function (importOriginal) {
  const original = (await importOriginal()) as object
  return {
    ...original,
    getMerkleBoxAddress: vi
      .fn()
      .mockReturnValue('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as const),
  }
})

const mockWalletClient = {
  chain: hemiSepolia,
} as unknown as WalletClient

const validParameters = {
  address: '0x1234567890123456789012345678901234567890' as const,
  amount: BigInt('1000000000000000000'),
  claimGroupId: 1,
  lockupMonths: 6,
  proof: [zeroHash, zeroHash],
  ratio: 75.5,
  termsSignature: zeroHash,
  walletClient: mockWalletClient,
}

describe('claimTokens', function () {
  it('should emit "claim-failed-validation" if the amount is zero', async function () {
    const { emitter, promise } = claimTokens({
      ...validParameters,
      amount: BigInt(0),
    })

    const failedValidation = vi.fn()
    emitter.on('claim-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'Amount must be greater than zero',
    )
  })

  it('should emit "claim-failed-validation" if the amount is negative', async function () {
    const { emitter, promise } = claimTokens({
      ...validParameters,
      amount: BigInt(-1),
    })

    const failedValidation = vi.fn()
    emitter.on('claim-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'Amount must be greater than zero',
    )
  })

  it('should emit "claim-failed-validation" if the account is not a valid address', async function () {
    const { emitter, promise } = claimTokens({
      ...validParameters,
      address: 'invalid-address',
    })

    const failedValidation = vi.fn()
    emitter.on('claim-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'Invalid account address format',
    )
  })

  it('should emit "claim-failed-validation" if the account is zero address', async function () {
    const { emitter, promise } = claimTokens({
      ...validParameters,
      address: zeroAddress,
    })

    const failedValidation = vi.fn()
    emitter.on('claim-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'Account cannot be zero address',
    )
  })

  it('should emit "claim-failed-validation" if the chain is not supported', async function () {
    const { emitter, promise } = claimTokens({
      ...validParameters,
      walletClient: {
        ...mockWalletClient,
        chain: { id: 9999 }, // Unsupported chain ID
      },
    })

    const failedValidation = vi.fn()
    emitter.on('claim-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'Invalid chain ID - only Hemi networks are supported',
    )
  })

  it('should emit "claim-failed-validation" if tokens are not claimable on-chain', async function () {
    vi.mocked(readContract).mockResolvedValue(false)

    const { emitter, promise } = claimTokens(validParameters)

    const failedValidation = vi.fn()
    emitter.on('claim-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'Tokens not claimable - may be already claimed or invalid proof',
    )
  })

  it('should emit "claim-failed-validation" if contract validation fails', async function () {
    vi.mocked(readContract).mockRejectedValue(new Error('Contract error'))

    const { emitter, promise } = claimTokens(validParameters)

    const failedValidation = vi.fn()
    emitter.on('claim-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'Failed to validate claim eligibility',
    )
  })

  it('should emit "claim-failed-validation" if lockupMonths is invalid (not 6, 24, or 48)', async function () {
    const { emitter, promise } = claimTokens({
      ...validParameters,
      lockupMonths: 12, // Invalid lockup months
    })

    const failedValidation = vi.fn()
    emitter.on('claim-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'Lockup months must be 6, 24, or 48',
    )
  })

  it('should emit "claim-failed-validation" if ratio is below 50', async function () {
    const { emitter, promise } = claimTokens({
      ...validParameters,
      ratio: 49.99, // Below minimum
    })

    const failedValidation = vi.fn()
    emitter.on('claim-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'Ratio must be between 50 and 100',
    )
  })

  it('should emit "claim-failed-validation" if ratio is above 100', async function () {
    const { emitter, promise } = claimTokens({
      ...validParameters,
      ratio: 100.01, // Above maximum
    })

    const failedValidation = vi.fn()
    emitter.on('claim-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'Ratio must be between 50 and 100',
    )
  })

  it('should emit "claim-failed-validation" if claimGroupId is negative', async function () {
    const { emitter, promise } = claimTokens({
      ...validParameters,
      claimGroupId: -1,
    })

    const failedValidation = vi.fn()
    emitter.on('claim-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'Invalid claim group ID',
    )
  })

  it('should emit "claim-failed-validation" if claimGroupId is not a number', async function () {
    const { emitter, promise } = claimTokens({
      ...validParameters,
      claimGroupId: 'invalid',
    })

    const failedValidation = vi.fn()
    emitter.on('claim-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'Invalid claim group ID',
    )
  })

  it('should emit "claim-failed-validation" if proof is empty array', async function () {
    const { emitter, promise } = claimTokens({
      ...validParameters,
      proof: [],
    })

    const failedValidation = vi.fn()
    emitter.on('claim-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'Invalid proof format',
    )
  })

  it('should emit "claim-failed-validation" if proof is not an array of hex values', async function () {
    const { emitter, promise } = claimTokens({
      ...validParameters,
      proof: [123, 456],
    })

    const failedValidation = vi.fn()
    emitter.on('claim-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'Invalid proof format',
    )
  })

  it('should emit "claim-failed-validation" if proof is not an array', async function () {
    const { emitter, promise } = claimTokens({
      ...validParameters,
      proof: null,
    })

    const failedValidation = vi.fn()
    emitter.on('claim-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'Invalid proof format',
    )
  })
  it('should accept valid claimGroupId (0 and positive numbers)', async function () {
    const receipt = {
      status: 'success',
    } as TransactionReceipt

    vi.mocked(readContract).mockResolvedValue(true)
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = claimTokens({
      ...validParameters,
      claimGroupId: 0, // Should be valid
    })

    const onClaimTransactionSucceeded = vi.fn()
    emitter.on('claim-transaction-succeeded', onClaimTransactionSucceeded)

    await promise

    expect(onClaimTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(receipt)

    expect(writeContract).toHaveBeenCalledWith(
      mockWalletClient,
      expect.objectContaining({
        args: [
          BigInt(0), // claimGroupId should be 0
          validParameters.address,
          validParameters.amount,
          [zeroHash, zeroHash],
          validParameters.lockupMonths,
          7550, // ratio 75.5 * 100 = 7550
          validParameters.termsSignature,
        ],
        functionName: 'claim',
      }),
    )
  })

  it('should accept valid proof array with multiple hashes', async function () {
    const receipt = {
      status: 'success',
    } as TransactionReceipt

    const multipleProof = [zeroHash, zeroHash, zeroHash] // Three proof elements

    vi.mocked(readContract).mockResolvedValue(true)
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = claimTokens({
      ...validParameters,
      proof: multipleProof,
    })

    const onClaimTransactionSucceeded = vi.fn()
    emitter.on('claim-transaction-succeeded', onClaimTransactionSucceeded)

    await promise

    expect(onClaimTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(receipt)

    expect(writeContract).toHaveBeenCalledWith(
      mockWalletClient,
      expect.objectContaining({
        args: [
          BigInt(1),
          validParameters.address,
          validParameters.amount,
          multipleProof, // Should use the provided proof array
          validParameters.lockupMonths,
          7550, // ratio 75.5 * 100 = 7550
          validParameters.termsSignature,
        ],
        functionName: 'claim',
      }),
    )
  })

  it('should round ratio to 2 decimal places and accept valid values', async function () {
    const receipt = {
      status: 'success',
    } as TransactionReceipt

    vi.mocked(readContract).mockResolvedValue(true)
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = claimTokens({
      ...validParameters,
      ratio: 75.123456, // Should be rounded to 75.12
    })

    const onClaimTransactionSucceeded = vi.fn()
    emitter.on('claim-transaction-succeeded', onClaimTransactionSucceeded)

    await promise

    expect(onClaimTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(receipt)

    // Verify the rounded ratio was used in the contract call (75.12 * 100 = 7512)
    expect(writeContract).toHaveBeenCalledWith(
      mockWalletClient,
      expect.objectContaining({
        args: [
          BigInt(1),
          validParameters.address,
          validParameters.amount,
          [zeroHash, zeroHash],
          validParameters.lockupMonths,
          7512, // ratio should be 75.12 * 100 = 7512
          validParameters.termsSignature,
        ],
        functionName: 'claim',
      }),
    )
  })

  it('should accept valid lockup months (6, 24, 48)', async function () {
    const receipt = {
      status: 'success',
    } as TransactionReceipt

    vi.mocked(readContract).mockResolvedValue(true)
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const lockupMonths = 24
    const { emitter, promise } = claimTokens({
      ...validParameters,
      lockupMonths,
    })

    const onClaimTransactionSucceeded = vi.fn()
    emitter.on('claim-transaction-succeeded', onClaimTransactionSucceeded)

    await promise

    expect(onClaimTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(receipt)

    expect(writeContract).toHaveBeenCalledWith(
      mockWalletClient,
      expect.objectContaining({
        args: [
          BigInt(1),
          validParameters.address,
          validParameters.amount,
          [zeroHash, zeroHash],
          lockupMonths,
          7550, // ratio 75.5 * 100 = 7550
          validParameters.termsSignature,
        ],
        functionName: 'claim',
      }),
    )
  })

  it('should emit "claim-transaction-succeeded" when claim succeeds', async function () {
    const receipt = {
      status: 'success',
    } as TransactionReceipt

    vi.mocked(readContract).mockResolvedValue(true)
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = claimTokens(validParameters)

    const onPreClaim = vi.fn()
    const onUserSignedClaim = vi.fn()
    const onClaimTransactionSucceeded = vi.fn()
    const onClaimTransactionReverted = vi.fn()
    const onClaimSettled = vi.fn()

    emitter.on('pre-claim', onPreClaim)
    emitter.on('user-signed-claim', onUserSignedClaim)
    emitter.on('claim-transaction-succeeded', onClaimTransactionSucceeded)
    emitter.on('claim-transaction-reverted', onClaimTransactionReverted)
    emitter.on('claim-settled', onClaimSettled)

    await promise

    expect(onPreClaim).toHaveBeenCalledOnce()
    expect(onUserSignedClaim).toHaveBeenCalledExactlyOnceWith(zeroHash)
    expect(onClaimTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(receipt)
    expect(onClaimTransactionReverted).not.toHaveBeenCalled()
    expect(onClaimSettled).toHaveBeenCalledOnce()

    expect(writeContract).toHaveBeenCalledExactlyOnceWith(
      mockWalletClient,
      expect.objectContaining({
        account: validParameters.address,
        args: [
          BigInt(1),
          validParameters.address,
          validParameters.amount, // Use the user-provided amount
          [zeroHash, zeroHash],
          validParameters.lockupMonths,
          7550, // ratio 75.5 * 100 = 7550
          validParameters.termsSignature,
        ],
        functionName: 'claim',
      }),
    )
  })

  it('should emit "user-signing-claim-error" when signing fails', async function () {
    const signingError = new Error('User rejected transaction')

    vi.mocked(readContract).mockResolvedValue(true)
    vi.mocked(writeContract).mockRejectedValue(signingError)

    const { emitter, promise } = claimTokens(validParameters)

    const onPreClaim = vi.fn()
    const onUserSigningError = vi.fn()
    const onClaimSettled = vi.fn()

    emitter.on('pre-claim', onPreClaim)
    emitter.on('user-signing-claim-error', onUserSigningError)
    emitter.on('claim-settled', onClaimSettled)

    await promise

    expect(onPreClaim).toHaveBeenCalledOnce()
    expect(onUserSigningError).toHaveBeenCalledExactlyOnceWith(signingError)
    expect(onClaimSettled).toHaveBeenCalledOnce()
  })

  it('should emit "unexpected-error" when transaction receipt fails', async function () {
    const receiptError = new Error('Transaction receipt error')

    vi.mocked(readContract).mockResolvedValue(true)
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(receiptError)

    const { emitter, promise } = claimTokens(validParameters)

    const onPreClaim = vi.fn()
    const onUserSignedClaim = vi.fn()
    const onUnexpectedError = vi.fn()
    const onClaimSettled = vi.fn()

    emitter.on('pre-claim', onPreClaim)
    emitter.on('user-signed-claim', onUserSignedClaim)
    emitter.on('unexpected-error', onUnexpectedError)
    emitter.on('claim-settled', onClaimSettled)

    await promise

    expect(onPreClaim).toHaveBeenCalledOnce()
    expect(onUserSignedClaim).toHaveBeenCalledExactlyOnceWith(zeroHash)
    expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(receiptError)
    expect(onClaimSettled).toHaveBeenCalledOnce()
  })

  it('should emit "claim-transaction-reverted" when transaction reverts', async function () {
    const receipt = {
      status: 'reverted',
    } as TransactionReceipt

    vi.mocked(readContract).mockResolvedValue(true)
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = claimTokens(validParameters)

    const onPreClaim = vi.fn()
    const onUserSignedClaim = vi.fn()
    const onClaimTransactionSucceeded = vi.fn()
    const onClaimTransactionReverted = vi.fn()
    const onClaimSettled = vi.fn()

    emitter.on('pre-claim', onPreClaim)
    emitter.on('user-signed-claim', onUserSignedClaim)
    emitter.on('claim-transaction-succeeded', onClaimTransactionSucceeded)
    emitter.on('claim-transaction-reverted', onClaimTransactionReverted)
    emitter.on('claim-settled', onClaimSettled)

    await promise

    expect(onPreClaim).toHaveBeenCalledOnce()
    expect(onUserSignedClaim).toHaveBeenCalledExactlyOnceWith(zeroHash)
    expect(onClaimTransactionSucceeded).not.toHaveBeenCalled()
    expect(onClaimTransactionReverted).toHaveBeenCalledExactlyOnceWith(receipt)
    expect(onClaimSettled).toHaveBeenCalledOnce()
  })

  it('should work with Hemi mainnet chain', async function () {
    const receipt = {
      status: 'success',
    } as TransactionReceipt

    vi.mocked(readContract).mockResolvedValue(true)
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = claimTokens({
      ...validParameters,
      walletClient: {
        ...mockWalletClient,
        chain: hemi,
      },
    })

    const onClaimTransactionSucceeded = vi.fn()
    emitter.on('claim-transaction-succeeded', onClaimTransactionSucceeded)

    await promise

    expect(onClaimTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(receipt)
    expect(getMerkleBoxAddress).toHaveBeenCalledWith(hemi.id)
  })

  it('should allow partial claims when amount is less than eligibility', async function () {
    // Half of eligible amount - the rest goes to staking
    const partialAmount = BigInt('500000000000000000')
    const receipt = {
      status: 'success',
    } as TransactionReceipt

    vi.mocked(readContract).mockResolvedValue(true)
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = claimTokens({
      ...validParameters,
      amount: partialAmount,
    })

    const onClaimTransactionSucceeded = vi.fn()
    emitter.on('claim-transaction-succeeded', onClaimTransactionSucceeded)

    await promise

    expect(onClaimTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(receipt)

    // Verify the partial amount was used in the contract call
    expect(writeContract).toHaveBeenCalledWith(
      mockWalletClient,
      expect.objectContaining({
        args: [
          BigInt(1),
          validParameters.address,
          partialAmount,
          [zeroHash, zeroHash],
          validParameters.lockupMonths,
          7550, // ratio 75.5 * 100 = 7550
          validParameters.termsSignature,
        ],
        functionName: 'claim',
      }),
    )
  })

  it('should validate contract interaction with correct parameters', async function () {
    vi.mocked(readContract).mockResolvedValue(true)
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'success',
    } as TransactionReceipt)

    const { promise } = claimTokens(validParameters)

    await promise

    // Verify isClaimable was called with correct parameters
    expect(readContract).toHaveBeenCalledWith(mockWalletClient, {
      abi: expect.any(Array),
      address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      args: [
        BigInt(1),
        validParameters.address,
        validParameters.amount, // Use the user-provided amount
        [zeroHash, zeroHash],
      ],
      functionName: 'isClaimable',
    })
  })
})
