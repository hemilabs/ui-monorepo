import { hemiSepolia } from 'hemi-viem'
import { zeroAddress, zeroHash } from 'viem'
import { waitForTransactionReceipt, writeContract } from 'viem/actions'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { withdraw } from '../../../actions'
import {
  getHemiTokenAddress,
  memoizedGetHemiTokenAddress,
  getLockedBalance,
  getOwnerOf,
} from '../../../actions/public/veHemi'
import { getVeHemiContractAddress } from '../../../constants'

vi.mock('viem/actions', () => ({
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}))

vi.mock('../../../actions/public/veHemi', () => ({
  getHemiTokenAddress: vi.fn(),
  getLockedBalance: vi.fn(),
  getOwnerOf: vi.fn(),
  memoizedGetHemiTokenAddress: vi.fn(),
}))

const validParameters = {
  account: '0x1234567890123456789012345678901234567890' as const,
  tokenId: BigInt(1),
  walletClient: { chain: hemiSepolia },
}

describe('withdraw', function () {
  beforeEach(function () {
    vi.mocked(getHemiTokenAddress).mockResolvedValue(zeroAddress)
    vi.mocked(memoizedGetHemiTokenAddress).mockResolvedValue(zeroAddress)
    vi.mocked(getOwnerOf).mockResolvedValue(validParameters.account)

    // Mock getLockedBalance to return an expired lock with amount
    const pastTimestamp = BigInt(Math.floor(Date.now() / 1000) - 86400) // 1 day ago (expired)
    vi.mocked(getLockedBalance).mockResolvedValue({
      amount: BigInt(500),
      end: pastTimestamp,
    })
  })

  it('should emit "withdraw-failed-validation" if the account is not a valid address', async function () {
    const { emitter, promise } = withdraw({
      ...validParameters,
      account: 'invalid-address',
    })

    const withdrawFailedValidation = vi.fn()
    emitter.on('withdraw-failed-validation', withdrawFailedValidation)

    await promise

    expect(withdrawFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'account is not a valid address',
    )
  })

  it('should emit "withdraw-failed-validation" if account is zero address', async function () {
    const { emitter, promise } = withdraw({
      ...validParameters,
      account: zeroAddress,
    })

    const withdrawFailedValidation = vi.fn()
    emitter.on('withdraw-failed-validation', withdrawFailedValidation)

    await promise

    expect(withdrawFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'account cannot be zero address',
    )
  })

  it('should emit "withdraw-failed-validation" if tokenId is zero', async function () {
    const { emitter, promise } = withdraw({
      ...validParameters,
      tokenId: BigInt(0),
    })

    const withdrawFailedValidation = vi.fn()
    emitter.on('withdraw-failed-validation', withdrawFailedValidation)

    await promise

    expect(withdrawFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'invalid token ID',
    )
  })

  it('should emit "withdraw-failed-validation" if no existing lock', async function () {
    // Mock no existing lock (amount = 0)
    vi.mocked(getLockedBalance).mockResolvedValue({
      amount: BigInt(0),
      end: BigInt(Math.floor(Date.now() / 1000) - 86400),
    })

    const { emitter, promise } = withdraw(validParameters)

    const withdrawFailedValidation = vi.fn()
    emitter.on('withdraw-failed-validation', withdrawFailedValidation)

    await promise

    expect(withdrawFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'no existing lock',
    )
  })

  it('should emit "withdraw-failed-validation" if lock is not yet expired', async function () {
    // Mock lock that is still active (end timestamp in the future)
    const futureTimestamp = BigInt(Math.floor(Date.now() / 1000) + 86400) // 1 day from now
    vi.mocked(getLockedBalance).mockResolvedValue({
      amount: BigInt(500),
      end: futureTimestamp,
    })

    const { emitter, promise } = withdraw(validParameters)

    const withdrawFailedValidation = vi.fn()
    emitter.on('withdraw-failed-validation', withdrawFailedValidation)

    await promise

    expect(withdrawFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'lock not yet expired',
    )
  })

  it('should successfully withdraw from expired lock', async function () {
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'success',
    })

    const { emitter, promise } = withdraw(validParameters)

    const preWithdraw = vi.fn()
    const userSignedWithdraw = vi.fn()
    const withdrawTransactionSucceeded = vi.fn()
    const withdrawSettled = vi.fn()

    emitter.on('pre-withdraw', preWithdraw)
    emitter.on('user-signed-withdraw', userSignedWithdraw)
    emitter.on('withdraw-transaction-succeeded', withdrawTransactionSucceeded)
    emitter.on('withdraw-settled', withdrawSettled)

    await promise

    expect(preWithdraw).toHaveBeenCalledOnce()
    expect(userSignedWithdraw).toHaveBeenCalledWith(zeroHash)
    expect(withdrawTransactionSucceeded).toHaveBeenCalled()
    expect(withdrawSettled).toHaveBeenCalledOnce()

    expect(writeContract).toHaveBeenCalledWith(
      validParameters.walletClient,
      expect.objectContaining({
        address: getVeHemiContractAddress(hemiSepolia.id),
        args: [validParameters.tokenId],
        functionName: 'withdraw',
      }),
    )
  })

  it('should handle user rejecting withdraw', async function () {
    vi.mocked(writeContract).mockRejectedValue(new Error('User rejected'))

    const { emitter, promise } = withdraw(validParameters)

    const userSigningWithdrawError = vi.fn()
    const withdrawTransactionSucceeded = vi.fn()
    const withdrawSettled = vi.fn()

    emitter.on('user-signing-withdraw-error', userSigningWithdrawError)
    emitter.on('withdraw-transaction-succeeded', withdrawTransactionSucceeded)
    emitter.on('withdraw-settled', withdrawSettled)

    await promise

    expect(userSigningWithdrawError).toHaveBeenCalledOnce()
    expect(withdrawTransactionSucceeded).not.toHaveBeenCalled()
    expect(withdrawSettled).toHaveBeenCalledOnce()
  })

  it('should handle withdraw transaction failure', async function () {
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'reverted',
    })

    const { emitter, promise } = withdraw(validParameters)

    const withdrawTransactionReverted = vi.fn()
    const withdrawTransactionSucceeded = vi.fn()
    const withdrawSettled = vi.fn()

    emitter.on('withdraw-transaction-reverted', withdrawTransactionReverted)
    emitter.on('withdraw-transaction-succeeded', withdrawTransactionSucceeded)
    emitter.on('withdraw-settled', withdrawSettled)

    await promise

    expect(withdrawTransactionReverted).toHaveBeenCalled()
    expect(withdrawTransactionSucceeded).not.toHaveBeenCalled()
    expect(withdrawSettled).toHaveBeenCalledOnce()
  })

  it('should handle withdraw failure during waitForTransactionReceipt', async function () {
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(
      new Error('Network error'),
    )

    const { emitter, promise } = withdraw(validParameters)

    const withdrawFailed = vi.fn()
    const withdrawSettled = vi.fn()

    emitter.on('withdraw-failed', withdrawFailed)
    emitter.on('withdraw-settled', withdrawSettled)

    await promise

    expect(withdrawFailed).toHaveBeenCalledOnce()
    expect(withdrawSettled).toHaveBeenCalledOnce()
  })

  it('should handle wallet client without chain', async function () {
    const { emitter, promise } = withdraw({
      ...validParameters,
      walletClient: {},
    })

    const withdrawFailedValidation = vi.fn()
    emitter.on('withdraw-failed-validation', withdrawFailedValidation)

    await promise

    expect(withdrawFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'wallet client chain is not defined',
    )
  })

  it('should handle getLockedBalance failure', async function () {
    vi.mocked(getLockedBalance).mockRejectedValue(new Error('Contract error'))

    const { emitter, promise } = withdraw(validParameters)

    const withdrawFailedValidation = vi.fn()
    emitter.on('withdraw-failed-validation', withdrawFailedValidation)

    await promise

    expect(withdrawFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'failed to check lock status',
    )
  })

  it('should handle unsupported chain', async function () {
    const { emitter, promise } = withdraw({
      ...validParameters,
      walletClient: { chain: { ...hemiSepolia, id: 999999 } },
    })

    const withdrawFailedValidation = vi.fn()
    emitter.on('withdraw-failed-validation', withdrawFailedValidation)

    await promise

    expect(withdrawFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'chain is not supported',
    )
  })

  it('should handle unexpected errors', async function () {
    // Force an unexpected error by making writeContract throw after validation passes
    vi.mocked(writeContract).mockImplementation(function () {
      throw new Error('Unexpected error')
    })

    const { emitter, promise } = withdraw(validParameters)

    const unexpectedError = vi.fn()
    const withdrawSettled = vi.fn()

    emitter.on('unexpected-error', unexpectedError)
    emitter.on('withdraw-settled', withdrawSettled)

    await promise

    expect(unexpectedError).toHaveBeenCalledOnce()
    expect(withdrawSettled).toHaveBeenCalledOnce()
  })

  it('should handle withdraw at exact expiry time', async function () {
    // Mock lock that expires exactly now
    const nowTimestamp = BigInt(Math.floor(Date.now() / 1000))
    vi.mocked(getLockedBalance).mockResolvedValue({
      amount: BigInt(500),
      end: nowTimestamp,
    })

    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'success',
    })

    const { emitter, promise } = withdraw(validParameters)

    const withdrawTransactionSucceeded = vi.fn()
    const withdrawSettled = vi.fn()

    emitter.on('withdraw-transaction-succeeded', withdrawTransactionSucceeded)
    emitter.on('withdraw-settled', withdrawSettled)

    await promise

    expect(withdrawTransactionSucceeded).toHaveBeenCalled()
    expect(withdrawSettled).toHaveBeenCalledOnce()
  })
})
