import type { Address, Hash, TransactionReceipt, WalletClient } from 'viem'
import { zeroAddress, zeroHash } from 'viem'
import { waitForTransactionReceipt, writeContract } from 'viem/actions'
import { hemiSepolia } from 'viem/chains'
import { describe, expect, it, vi } from 'vitest'

import { claimAllRewards } from '../../../src/actions/wallet/claimAllRewards'

vi.mock('viem/actions', () => ({
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}))

const mockClient = { chain: hemiSepolia } as WalletClient
const mockTokenAddress = zeroAddress
// 1 token
const mockAmount = BigInt(1000000000000000000)
const mockProofs = [['0xproof1', '0xproof2']] as Hash[][]

const validParameters = {
  account: zeroAddress,
  amounts: [mockAmount],
  client: mockClient,
  distributorAddress: zeroAddress,
  proofs: mockProofs,
  tokens: [mockTokenAddress],
  users: [zeroAddress],
}

describe('claimAllRewards', function () {
  it('should emit "claim-all-rewards-failed-validation" if users array is empty', async function () {
    const { emitter, promise } = claimAllRewards({
      ...validParameters,
      amounts: [],
      proofs: [],
      tokens: [],
      users: [],
    })

    const onFailedValidation = vi.fn()
    const onSettled = vi.fn()
    emitter.on('claim-all-rewards-failed-validation', onFailedValidation)
    emitter.on('claim-all-rewards-settled', onSettled)

    await promise

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'At least one user is required',
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "claim-all-rewards-failed-validation" if users and tokens arrays have different lengths', async function () {
    const { emitter, promise } = claimAllRewards({
      ...validParameters,
      // Different length
      tokens: [mockTokenAddress, mockTokenAddress],
    })

    const onFailedValidation = vi.fn()
    const onSettled = vi.fn()
    emitter.on('claim-all-rewards-failed-validation', onFailedValidation)
    emitter.on('claim-all-rewards-settled', onSettled)

    await promise

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'Users and tokens arrays must have the same length',
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "claim-all-rewards-failed-validation" if users and amounts arrays have different lengths', async function () {
    const { emitter, promise } = claimAllRewards({
      ...validParameters,
      amounts: [mockAmount, mockAmount], // Different length
    })

    const onFailedValidation = vi.fn()
    const onSettled = vi.fn()
    emitter.on('claim-all-rewards-failed-validation', onFailedValidation)
    emitter.on('claim-all-rewards-settled', onSettled)

    await promise

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'Users and amounts arrays must have the same length',
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "claim-all-rewards-failed-validation" if users and proofs arrays have different lengths', async function () {
    const { emitter, promise } = claimAllRewards({
      ...validParameters,
      proofs: [mockProofs[0], ['0xproof3']], // Different length
    })

    const onFailedValidation = vi.fn()
    const onSettled = vi.fn()
    emitter.on('claim-all-rewards-failed-validation', onFailedValidation)
    emitter.on('claim-all-rewards-settled', onSettled)

    await promise

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'Users and proofs arrays must have the same length',
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "claim-all-rewards-failed-validation" if distributor address is not provided', async function () {
    const { emitter, promise } = claimAllRewards({
      ...validParameters,
      distributorAddress: '' as Address,
    })

    const onFailedValidation = vi.fn()
    const onSettled = vi.fn()
    emitter.on('claim-all-rewards-failed-validation', onFailedValidation)
    emitter.on('claim-all-rewards-settled', onSettled)

    await promise

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'Distributor address is required',
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "claim-all-rewards-failed-validation" if distributor address is invalid', async function () {
    const { emitter, promise } = claimAllRewards({
      ...validParameters,
      distributorAddress: 'invalid-address' as Address,
    })

    const onFailedValidation = vi.fn()
    const onSettled = vi.fn()
    emitter.on('claim-all-rewards-failed-validation', onFailedValidation)
    emitter.on('claim-all-rewards-settled', onSettled)

    await promise

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'Distributor address is not a valid address',
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "claim-all-rewards-failed-validation" if account is not provided', async function () {
    const { emitter, promise } = claimAllRewards({
      ...validParameters,
      account: undefined as unknown as Address,
    })

    const onFailedValidation = vi.fn()
    const onSettled = vi.fn()
    emitter.on('claim-all-rewards-failed-validation', onFailedValidation)
    emitter.on('claim-all-rewards-settled', onSettled)

    await promise

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'Client is not defined',
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "claim-all-rewards-failed-validation" if account is invalid', async function () {
    const { emitter, promise } = claimAllRewards({
      ...validParameters,
      account: 'invalid-account' as Address,
    })

    const onFailedValidation = vi.fn()
    const onSettled = vi.fn()
    emitter.on('claim-all-rewards-failed-validation', onFailedValidation)
    emitter.on('claim-all-rewards-settled', onSettled)

    await promise

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'Account is not a valid address',
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "claim-all-rewards-failed-validation" if a user address is invalid', async function () {
    const { emitter, promise } = claimAllRewards({
      ...validParameters,
      users: ['invalid-user-address' as Address],
    })

    const onFailedValidation = vi.fn()
    const onSettled = vi.fn()
    emitter.on('claim-all-rewards-failed-validation', onFailedValidation)
    emitter.on('claim-all-rewards-settled', onSettled)

    await promise

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'All user addresses must be valid',
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "claim-all-rewards-failed-validation" if a token address is invalid', async function () {
    const { emitter, promise } = claimAllRewards({
      ...validParameters,
      tokens: ['invalid-token-address' as Address],
    })

    const onFailedValidation = vi.fn()
    const onSettled = vi.fn()
    emitter.on('claim-all-rewards-failed-validation', onFailedValidation)
    emitter.on('claim-all-rewards-settled', onSettled)

    await promise

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'All token addresses must be valid',
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "claim-all-rewards-failed-validation" if multiple user addresses are invalid', async function () {
    const { emitter, promise } = claimAllRewards({
      ...validParameters,
      amounts: [mockAmount, mockAmount],
      proofs: [mockProofs[0], mockProofs[0]],
      tokens: [mockTokenAddress, mockTokenAddress],
      users: [zeroAddress, 'invalid-user-address' as Address],
    })

    const onFailedValidation = vi.fn()
    const onSettled = vi.fn()
    emitter.on('claim-all-rewards-failed-validation', onFailedValidation)
    emitter.on('claim-all-rewards-settled', onSettled)

    await promise

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'All user addresses must be valid',
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "claim-all-rewards-failed-validation" if multiple token addresses are invalid', async function () {
    const { emitter, promise } = claimAllRewards({
      ...validParameters,
      amounts: [mockAmount, mockAmount],
      proofs: [mockProofs[0], mockProofs[0]],
      // @ts-expect-error testing invalid addresses
      tokens: [mockTokenAddress, 'invalid-token-address'],
      users: [zeroAddress, zeroAddress],
    })

    const onFailedValidation = vi.fn()
    const onSettled = vi.fn()
    emitter.on('claim-all-rewards-failed-validation', onFailedValidation)
    emitter.on('claim-all-rewards-settled', onSettled)

    await promise

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'All token addresses must be valid',
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "claim-all-rewards-failed-validation" when validation fails due to error', async function () {
    // Mock writeContract to throw an error that will be caught in the validation catch block
    vi.mocked(writeContract).mockImplementation(function () {
      throw new Error('Network error during validation')
    })

    const { emitter, promise } = claimAllRewards({
      ...validParameters,
      // Force validation to fail by making amounts array wrong length during the call
      amounts: [],
    })

    const onFailedValidation = vi.fn()
    const onSettled = vi.fn()
    emitter.on('claim-all-rewards-failed-validation', onFailedValidation)
    emitter.on('claim-all-rewards-settled', onSettled)

    await promise

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'Users and amounts arrays must have the same length',
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "claim-all-rewards-transaction-succeeded" when claim succeeds', async function () {
    const receipt = {
      status: 'success',
    } as TransactionReceipt

    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = claimAllRewards(validParameters)

    const onPreClaimAllRewards = vi.fn()
    const onUserSignedClaimAllRewards = vi.fn()
    const onClaimAllRewardsTransactionSucceeded = vi.fn()
    const onClaimAllRewardsTransactionReverted = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-claim-all-rewards', onPreClaimAllRewards)
    emitter.on('user-signed-claim-all-rewards', onUserSignedClaimAllRewards)
    emitter.on(
      'claim-all-rewards-transaction-succeeded',
      onClaimAllRewardsTransactionSucceeded,
    )
    emitter.on(
      'claim-all-rewards-transaction-reverted',
      onClaimAllRewardsTransactionReverted,
    )
    emitter.on('claim-all-rewards-settled', onSettled)

    await promise

    expect(onPreClaimAllRewards).toHaveBeenCalledOnce()
    expect(onUserSignedClaimAllRewards).toHaveBeenCalledExactlyOnceWith(
      zeroHash,
    )
    expect(
      onClaimAllRewardsTransactionSucceeded,
    ).toHaveBeenCalledExactlyOnceWith(receipt)
    expect(onClaimAllRewardsTransactionReverted).not.toHaveBeenCalled()
    expect(writeContract).toHaveBeenCalledExactlyOnceWith(
      validParameters.client,
      {
        abi: expect.any(Array),
        account: validParameters.account,
        address: validParameters.distributorAddress,
        args: [
          validParameters.users,
          validParameters.tokens,
          validParameters.amounts,
          validParameters.proofs,
        ],
        chain: validParameters.client.chain,
        functionName: 'claim',
      },
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "user-signing-claim-all-rewards-error" when claim signing fails', async function () {
    vi.mocked(writeContract).mockRejectedValue(new Error('Claim signing error'))

    const { emitter, promise } = claimAllRewards(validParameters)

    const onPreClaimAllRewards = vi.fn()
    const onUserSigningClaimAllRewardsError = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-claim-all-rewards', onPreClaimAllRewards)
    emitter.on(
      'user-signing-claim-all-rewards-error',
      onUserSigningClaimAllRewardsError,
    )
    emitter.on('claim-all-rewards-settled', onSettled)

    await promise

    expect(onPreClaimAllRewards).toHaveBeenCalledOnce()
    expect(onUserSigningClaimAllRewardsError).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "claim-all-rewards-failed" when claim receipt fails', async function () {
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(
      new Error('Receipt error'),
    )

    const { emitter, promise } = claimAllRewards(validParameters)

    const onPreClaimAllRewards = vi.fn()
    const onUserSignedClaimAllRewards = vi.fn()
    const onClaimAllRewardsFailed = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-claim-all-rewards', onPreClaimAllRewards)
    emitter.on('user-signed-claim-all-rewards', onUserSignedClaimAllRewards)
    emitter.on('claim-all-rewards-failed', onClaimAllRewardsFailed)
    emitter.on('claim-all-rewards-settled', onSettled)

    await promise

    expect(onPreClaimAllRewards).toHaveBeenCalledOnce()
    expect(onUserSignedClaimAllRewards).toHaveBeenCalledExactlyOnceWith(
      zeroHash,
    )
    expect(onClaimAllRewardsFailed).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "claim-all-rewards-transaction-reverted" when claim transaction reverts', async function () {
    const receipt = {
      status: 'reverted',
    } as TransactionReceipt

    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = claimAllRewards(validParameters)

    const onPreClaimAllRewards = vi.fn()
    const onUserSignedClaimAllRewards = vi.fn()
    const onClaimAllRewardsTransactionReverted = vi.fn()
    const onClaimAllRewardsTransactionSucceeded = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-claim-all-rewards', onPreClaimAllRewards)
    emitter.on('user-signed-claim-all-rewards', onUserSignedClaimAllRewards)
    emitter.on(
      'claim-all-rewards-transaction-reverted',
      onClaimAllRewardsTransactionReverted,
    )
    emitter.on(
      'claim-all-rewards-transaction-succeeded',
      onClaimAllRewardsTransactionSucceeded,
    )
    emitter.on('claim-all-rewards-settled', onSettled)

    await promise

    expect(onPreClaimAllRewards).toHaveBeenCalledOnce()
    expect(onUserSignedClaimAllRewards).toHaveBeenCalledExactlyOnceWith(
      zeroHash,
    )
    expect(
      onClaimAllRewardsTransactionReverted,
    ).toHaveBeenCalledExactlyOnceWith(receipt)
    expect(onClaimAllRewardsTransactionSucceeded).not.toHaveBeenCalled()
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "user-signing-claim-all-rewards-error" when the user rejects to sign', async function () {
    vi.mocked(writeContract).mockRejectedValue(
      new Error('User rejected the transaction'),
    )

    const { emitter, promise } = claimAllRewards(validParameters)

    const onPreClaimAllRewards = vi.fn()
    const onUserSigningClaimAllRewardsError = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-claim-all-rewards', onPreClaimAllRewards)
    emitter.on(
      'user-signing-claim-all-rewards-error',
      onUserSigningClaimAllRewardsError,
    )
    emitter.on('claim-all-rewards-settled', onSettled)

    await promise

    expect(onPreClaimAllRewards).toHaveBeenCalledOnce()
    expect(onUserSigningClaimAllRewardsError).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "claim-all-rewards-failed" when an unexpected error occurs', async function () {
    vi.mocked(writeContract).mockImplementation(function () {
      throw new Error('Unexpected error')
    })

    const { emitter, promise } = claimAllRewards(validParameters)

    const onClaimAllRewardsFailed = vi.fn()
    const onUserSigningClaimAllRewardsError = vi.fn()
    const onSettled = vi.fn()

    emitter.on('claim-all-rewards-failed', onClaimAllRewardsFailed)
    emitter.on(
      'user-signing-claim-all-rewards-error',
      onUserSigningClaimAllRewardsError,
    )
    emitter.on('claim-all-rewards-settled', onSettled)

    await promise

    expect(onClaimAllRewardsFailed).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    )
    expect(onUserSigningClaimAllRewardsError).not.toHaveBeenCalled()
    expect(onSettled).toHaveBeenCalledOnce()
  })
})
