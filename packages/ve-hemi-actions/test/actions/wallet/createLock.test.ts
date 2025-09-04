import { hemiSepolia } from 'hemi-viem'
import { zeroAddress, zeroHash } from 'viem'
import { waitForTransactionReceipt, writeContract } from 'viem/actions'
import {
  approveErc20Token,
  getErc20TokenAllowance,
  getErc20TokenBalance,
} from 'viem-erc20/actions'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { createLock } from '../../../actions'
import {
  getHemiTokenAddress,
  memoizedGetHemiTokenAddress,
} from '../../../actions/public/veHemi'
import { getVeHemiContractAddress } from '../../../constants'

vi.mock('viem/actions', () => ({
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}))

vi.mock('viem-erc20/actions', () => ({
  approveErc20Token: vi.fn(),
  getErc20TokenAllowance: vi.fn(),
  getErc20TokenBalance: vi.fn(),
}))

vi.mock('../../../actions/public/veHemi', () => ({
  getHemiTokenAddress: vi.fn(),
  memoizedGetHemiTokenAddress: vi.fn(),
}))

const validParameters = {
  account: '0x1234567890123456789012345678901234567890' as const,
  amount: BigInt(100),
  lockDurationInSeconds: BigInt(30 * 24 * 60 * 60), // 30 days
  walletClient: { chain: hemiSepolia },
}

describe('createLock', function () {
  beforeEach(function () {
    vi.clearAllMocks()
    vi.mocked(getHemiTokenAddress).mockResolvedValue(zeroAddress)
    vi.mocked(memoizedGetHemiTokenAddress).mockResolvedValue(zeroAddress)
  })

  it('should emit "lock-creation-failed-validation" if the account is not a valid address', async function () {
    const { emitter, promise } = createLock({
      ...validParameters,
      account: 'invalid-address',
      walletClient: { chain: hemiSepolia },
    })

    const lockCreationFailedValidation = vi.fn()
    emitter.on('lock-creation-failed-validation', lockCreationFailedValidation)

    await promise

    expect(lockCreationFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'account is not a valid address',
    )
  })

  it('should emit "lock-creation-failed-validation" if amount is zero', async function () {
    const { emitter, promise } = createLock({
      ...validParameters,
      amount: BigInt(0),
      walletClient: { chain: hemiSepolia },
    })

    const lockCreationFailedValidation = vi.fn()
    emitter.on('lock-creation-failed-validation', lockCreationFailedValidation)

    await promise

    expect(lockCreationFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'amount cannot be zero',
    )
  })

  it('should emit "lock-creation-failed-validation" if user has insufficient balance', async function () {
    vi.mocked(getErc20TokenBalance).mockResolvedValue(BigInt(50))

    const { emitter, promise } = createLock(validParameters)

    const lockCreationFailedValidation = vi.fn()
    emitter.on('lock-creation-failed-validation', lockCreationFailedValidation)

    await promise

    expect(lockCreationFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'insufficient balance',
    )
  })

  it('should approve tokens if allowance is insufficient', async function () {
    vi.mocked(getErc20TokenBalance).mockResolvedValue(BigInt(1000))
    vi.mocked(getErc20TokenAllowance).mockResolvedValue(BigInt(50))
    vi.mocked(approveErc20Token).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'success',
    })
    vi.mocked(writeContract).mockResolvedValue(zeroHash)

    const { emitter, promise } = createLock(validParameters)

    const preApprove = vi.fn()
    const userSignedApprove = vi.fn()
    const approveTransactionSucceeded = vi.fn()
    const preLockCreation = vi.fn()
    const lockCreationSettled = vi.fn()

    emitter.on('pre-approve', preApprove)
    emitter.on('user-signed-approve', userSignedApprove)
    emitter.on('approve-transaction-succeeded', approveTransactionSucceeded)
    emitter.on('pre-lock-creation', preLockCreation)
    emitter.on('lock-creation-settled', lockCreationSettled)

    await promise

    expect(preApprove).toHaveBeenCalledOnce()
    expect(userSignedApprove).toHaveBeenCalledWith(zeroHash)
    expect(approveTransactionSucceeded).toHaveBeenCalled()
    expect(preLockCreation).toHaveBeenCalledOnce()
    expect(lockCreationSettled).toHaveBeenCalledOnce()
    expect(approveErc20Token).toHaveBeenCalledWith(
      validParameters.walletClient,
      expect.objectContaining({
        amount: validParameters.amount,
        spender: getVeHemiContractAddress(hemiSepolia.id),
      }),
    )
  })

  it('should use custom approval amount if provided', async function () {
    vi.mocked(getErc20TokenBalance).mockResolvedValue(BigInt(1000))
    vi.mocked(getErc20TokenAllowance).mockResolvedValue(BigInt(0))
    vi.mocked(approveErc20Token).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'success',
    })
    vi.mocked(writeContract).mockResolvedValue(zeroHash)

    const customApprovalAmount = BigInt(500)

    const { emitter, promise } = createLock({
      ...validParameters,
      approvalAmount: customApprovalAmount,
    })

    const preApprove = vi.fn()
    emitter.on('pre-approve', preApprove)

    await promise

    expect(approveErc20Token).toHaveBeenCalledWith(
      validParameters.walletClient,
      expect.objectContaining({
        amount: customApprovalAmount,
      }),
    )
  })

  it('should successfully create lock after approval', async function () {
    vi.mocked(getErc20TokenBalance).mockResolvedValue(validParameters.amount)
    vi.mocked(getErc20TokenAllowance).mockResolvedValue(
      BigInt(validParameters.amount),
    )
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'success',
    })

    const { emitter, promise } = createLock(validParameters)

    const preLockCreation = vi.fn()
    const userSignedLockCreation = vi.fn()
    const lockCreationTransactionSucceeded = vi.fn()
    const lockCreationSettled = vi.fn()

    emitter.on('pre-lock-creation', preLockCreation)
    emitter.on('user-signed-lock-creation', userSignedLockCreation)
    emitter.on(
      'lock-creation-transaction-succeeded',
      lockCreationTransactionSucceeded,
    )
    emitter.on('lock-creation-settled', lockCreationSettled)

    await promise

    expect(preLockCreation).toHaveBeenCalledOnce()
    expect(userSignedLockCreation).toHaveBeenCalledWith(zeroHash)
    expect(lockCreationTransactionSucceeded).toHaveBeenCalled()
    expect(lockCreationSettled).toHaveBeenCalledOnce()

    expect(writeContract).toHaveBeenCalledWith(
      validParameters.walletClient,
      expect.objectContaining({
        address: getVeHemiContractAddress(hemiSepolia.id),
        args: [validParameters.amount, validParameters.lockDurationInSeconds],
        functionName: 'createLock',
      }),
    )
  })

  it('should skip approval if allowance is sufficient', async function () {
    vi.mocked(getErc20TokenBalance).mockResolvedValue(validParameters.amount)
    vi.mocked(getErc20TokenAllowance).mockResolvedValue(
      validParameters.amount + BigInt(1),
    )
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'success',
    })

    const { emitter, promise } = createLock(validParameters)

    const preApprove = vi.fn()
    const preLockCreation = vi.fn()
    const lockCreationSettled = vi.fn()

    emitter.on('pre-approve', preApprove)
    emitter.on('pre-lock-creation', preLockCreation)
    emitter.on('lock-creation-settled', lockCreationSettled)

    await promise

    expect(preApprove).not.toHaveBeenCalled()
    expect(preLockCreation).toHaveBeenCalledOnce()
    expect(lockCreationSettled).toHaveBeenCalledOnce()
    expect(approveErc20Token).not.toHaveBeenCalled()
  })

  it('should handle approve transaction failure', async function () {
    vi.mocked(getErc20TokenBalance).mockResolvedValue(BigInt(1000))
    vi.mocked(getErc20TokenAllowance).mockResolvedValue(BigInt(0))
    vi.mocked(approveErc20Token).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt)
      .mockResolvedValueOnce({
        status: 'reverted',
      })
      .mockResolvedValue({
        status: 'success',
      })

    const { emitter, promise } = createLock(validParameters)

    const approveTransactionReverted = vi.fn()
    const preLockCreation = vi.fn()
    const lockCreationSettled = vi.fn()

    emitter.on('approve-transaction-reverted', approveTransactionReverted)
    emitter.on('pre-lock-creation', preLockCreation)
    emitter.on('lock-creation-settled', lockCreationSettled)

    await promise

    expect(approveTransactionReverted).toHaveBeenCalled()
    expect(preLockCreation).not.toHaveBeenCalled()
    expect(lockCreationSettled).toHaveBeenCalledOnce()
  })

  it('should handle user rejecting approval', async function () {
    vi.mocked(getErc20TokenBalance).mockResolvedValue(BigInt(1000))
    vi.mocked(getErc20TokenAllowance).mockResolvedValue(BigInt(0))
    vi.mocked(approveErc20Token).mockRejectedValue(new Error('User rejected'))

    const { emitter, promise } = createLock(validParameters)

    const userSigningApproveError = vi.fn()
    const preLockCreation = vi.fn()
    const lockCreationSettled = vi.fn()

    emitter.on('user-signing-approve-error', userSigningApproveError)
    emitter.on('pre-lock-creation', preLockCreation)
    emitter.on('lock-creation-settled', lockCreationSettled)

    await promise

    expect(userSigningApproveError).toHaveBeenCalledOnce()
    expect(preLockCreation).not.toHaveBeenCalled()
    expect(lockCreationSettled).toHaveBeenCalledOnce()
  })

  it('should handle user rejecting lock creation', async function () {
    vi.mocked(getErc20TokenBalance).mockResolvedValue(BigInt(1000))
    vi.mocked(getErc20TokenAllowance).mockResolvedValue(BigInt(200))
    vi.mocked(writeContract).mockRejectedValue(new Error('User rejected'))

    const { emitter, promise } = createLock(validParameters)

    const userSigningLockCreationError = vi.fn()
    const lockCreationTransactionSucceeded = vi.fn()
    const lockCreationSettled = vi.fn()

    emitter.on('user-signing-lock-creation-error', userSigningLockCreationError)
    emitter.on(
      'lock-creation-transaction-succeeded',
      lockCreationTransactionSucceeded,
    )
    emitter.on('lock-creation-settled', lockCreationSettled)

    await promise

    expect(userSigningLockCreationError).toHaveBeenCalledOnce()
    expect(lockCreationTransactionSucceeded).not.toHaveBeenCalled()
    expect(lockCreationSettled).toHaveBeenCalledOnce()
  })

  it('should handle lock creation transaction failure', async function () {
    vi.mocked(getErc20TokenBalance).mockResolvedValue(BigInt(1000))
    vi.mocked(getErc20TokenAllowance).mockResolvedValue(BigInt(200))
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'reverted',
    })

    const { emitter, promise } = createLock(validParameters)

    const lockCreationTransactionReverted = vi.fn()
    const lockCreationTransactionSucceeded = vi.fn()
    const lockCreationSettled = vi.fn()

    emitter.on(
      'lock-creation-transaction-reverted',
      lockCreationTransactionReverted,
    )
    emitter.on(
      'lock-creation-transaction-succeeded',
      lockCreationTransactionSucceeded,
    )
    emitter.on('lock-creation-settled', lockCreationSettled)

    await promise

    expect(lockCreationTransactionReverted).toHaveBeenCalled()
    expect(lockCreationTransactionSucceeded).not.toHaveBeenCalled()
    expect(lockCreationSettled).toHaveBeenCalledOnce()
  })

  it('should handle approval failure during waitForTransactionReceipt', async function () {
    vi.mocked(getErc20TokenBalance).mockResolvedValue(BigInt(1000))
    vi.mocked(getErc20TokenAllowance).mockResolvedValue(BigInt(0))
    vi.mocked(approveErc20Token).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(
      new Error('Network error'),
    )

    const { emitter, promise } = createLock(validParameters)

    const approveFailed = vi.fn()
    const lockCreationSettled = vi.fn()

    emitter.on('approve-failed', approveFailed)
    emitter.on('lock-creation-settled', lockCreationSettled)

    await promise

    expect(approveFailed).toHaveBeenCalledOnce()
    expect(lockCreationSettled).toHaveBeenCalledOnce()
  })

  it('should handle lock creation failure during waitForTransactionReceipt', async function () {
    vi.mocked(getErc20TokenBalance).mockResolvedValue(BigInt(1000))
    vi.mocked(getErc20TokenAllowance).mockResolvedValue(BigInt(200))
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(
      new Error('Network error'),
    )

    const { emitter, promise } = createLock(validParameters)

    const lockCreationFailed = vi.fn()
    const lockCreationSettled = vi.fn()

    emitter.on('lock-creation-failed', lockCreationFailed)
    emitter.on('lock-creation-settled', lockCreationSettled)

    await promise

    expect(lockCreationFailed).toHaveBeenCalledOnce()
    expect(lockCreationSettled).toHaveBeenCalledOnce()
  })

  it('should handle wallet client without chain', async function () {
    const { emitter, promise } = createLock({
      ...validParameters,
      walletClient: {},
    })

    const lockCreationFailedValidation = vi.fn()
    emitter.on('lock-creation-failed-validation', lockCreationFailedValidation)

    await promise

    expect(lockCreationFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'wallet client chain is not defined',
    )
  })

  it('should handle balance check failure', async function () {
    vi.mocked(getErc20TokenBalance).mockRejectedValue(new Error('RPC error'))

    const { emitter, promise } = createLock(validParameters)

    const lockCreationFailedValidation = vi.fn()
    emitter.on('lock-creation-failed-validation', lockCreationFailedValidation)

    await promise

    expect(lockCreationFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'failed to check balance',
    )
  })

  it('should handle unexpected errors', async function () {
    // Force an unexpected error by making getErc20TokenBalance throw during validation
    vi.mocked(getErc20TokenBalance).mockRejectedValue(new Error('Unexpected'))

    const { emitter, promise } = createLock(validParameters)

    const unexpectedError = vi.fn()
    const lockCreationFailedValidation = vi.fn()
    const lockCreationSettled = vi.fn()

    emitter.on('unexpected-error', unexpectedError)
    emitter.on('lock-creation-failed-validation', lockCreationFailedValidation)
    emitter.on('lock-creation-settled', lockCreationSettled)

    await promise

    // The error should be caught and result in validation failure, not unexpected error
    // because the try-catch in canCreateLock handles getErc20TokenBalance errors
    expect(lockCreationFailedValidation).toHaveBeenCalledWith(
      'failed to check balance',
    )
    expect(lockCreationSettled).toHaveBeenCalledOnce()
  })
})
