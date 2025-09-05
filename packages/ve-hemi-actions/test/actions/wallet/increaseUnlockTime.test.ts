import { hemiSepolia } from 'hemi-viem'
import { zeroAddress, zeroHash } from 'viem'
import { waitForTransactionReceipt, writeContract } from 'viem/actions'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { increaseUnlockTime } from '../../../actions'
import {
  getHemiTokenAddress,
  memoizedGetHemiTokenAddress,
  getLockedBalance,
} from '../../../actions/public/veHemi'
import { getVeHemiContractAddress } from '../../../constants'

vi.mock('viem/actions', () => ({
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}))

vi.mock('../../../actions/public/veHemi', () => ({
  getHemiTokenAddress: vi.fn(),
  getLockedBalance: vi.fn(),
  memoizedGetHemiTokenAddress: vi.fn(),
}))

const validParameters = {
  account: '0x1234567890123456789012345678901234567890' as const,
  lockDurationInSeconds: 30 * 24 * 60 * 60, // 30 days
  tokenId: BigInt(1),
  walletClient: { chain: hemiSepolia },
}

describe('increaseUnlockTime', function () {
  beforeEach(function () {
    vi.mocked(getHemiTokenAddress).mockResolvedValue(zeroAddress)
    vi.mocked(memoizedGetHemiTokenAddress).mockResolvedValue(zeroAddress)

    // Mock getLockedBalance to return a lock with amount and future expiry date
    const futureTimestamp = BigInt(Math.floor(Date.now() / 1000) + 86400) // 1 day from now
    vi.mocked(getLockedBalance).mockResolvedValue({
      amount: BigInt(500),
      end: futureTimestamp,
    })
  })

  it('should emit "increase-unlock-time-failed-validation" if the account is not a valid address', async function () {
    const { emitter, promise } = increaseUnlockTime({
      ...validParameters,
      account: 'invalid-address',
    })

    const increaseUnlockTimeFailedValidation = vi.fn()
    emitter.on(
      'increase-unlock-time-failed-validation',
      increaseUnlockTimeFailedValidation,
    )

    await promise

    expect(increaseUnlockTimeFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'account is not a valid address',
    )
  })

  it('should emit "increase-unlock-time-failed-validation" if tokenId is zero', async function () {
    const { emitter, promise } = increaseUnlockTime({
      ...validParameters,
      tokenId: BigInt(0),
    })

    const increaseUnlockTimeFailedValidation = vi.fn()
    emitter.on(
      'increase-unlock-time-failed-validation',
      increaseUnlockTimeFailedValidation,
    )

    await promise

    expect(increaseUnlockTimeFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'invalid token ID',
    )
  })

  it('should emit "increase-unlock-time-failed-validation" if lockDurationInSeconds is zero', async function () {
    const { emitter, promise } = increaseUnlockTime({
      ...validParameters,
      lockDurationInSeconds: 0,
    })

    const increaseUnlockTimeFailedValidation = vi.fn()
    emitter.on(
      'increase-unlock-time-failed-validation',
      increaseUnlockTimeFailedValidation,
    )

    await promise

    expect(increaseUnlockTimeFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'lock duration must be positive',
    )
  })

  it('should emit "increase-unlock-time-failed-validation" if lockDurationInSeconds is negative', async function () {
    const { emitter, promise } = increaseUnlockTime({
      ...validParameters,
      lockDurationInSeconds: -1,
    })

    const increaseUnlockTimeFailedValidation = vi.fn()
    emitter.on(
      'increase-unlock-time-failed-validation',
      increaseUnlockTimeFailedValidation,
    )

    await promise

    expect(increaseUnlockTimeFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'lock duration must be positive',
    )
  })

  it('should emit "increase-unlock-time-failed-validation" if no existing lock', async function () {
    // Mock no existing lock (amount = 0)
    vi.mocked(getLockedBalance).mockResolvedValue({
      amount: BigInt(0),
      end: BigInt(Math.floor(Date.now() / 1000) + 86400),
    })

    const { emitter, promise } = increaseUnlockTime(validParameters)

    const increaseUnlockTimeFailedValidation = vi.fn()
    emitter.on(
      'increase-unlock-time-failed-validation',
      increaseUnlockTimeFailedValidation,
    )

    await promise

    expect(increaseUnlockTimeFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'no existing lock',
    )
  })

  it('should emit "increase-unlock-time-failed-validation" if lock is expired', async function () {
    // Mock expired lock (end timestamp in the past)
    const pastTimestamp = BigInt(Math.floor(Date.now() / 1000) - 86400) // 1 day ago
    vi.mocked(getLockedBalance).mockResolvedValue({
      amount: BigInt(500),
      end: pastTimestamp,
    })

    const { emitter, promise } = increaseUnlockTime(validParameters)

    const increaseUnlockTimeFailedValidation = vi.fn()
    emitter.on(
      'increase-unlock-time-failed-validation',
      increaseUnlockTimeFailedValidation,
    )

    await promise

    expect(increaseUnlockTimeFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'lock already expired',
    )
  })

  it('should emit "increase-unlock-time-failed-validation" if new unlock time is not greater than current', async function () {
    // Mock lock with end time that would not be extended by the short duration
    const futureTimestamp = BigInt(Math.floor(Date.now() / 1000) + 86400 * 60) // 60 days from now
    vi.mocked(getLockedBalance).mockResolvedValue({
      amount: BigInt(500),
      end: futureTimestamp,
    })

    const { emitter, promise } = increaseUnlockTime({
      ...validParameters,
      lockDurationInSeconds: 86400 * 30, // Only 30 days, but lock already expires in 60 days
    })

    const increaseUnlockTimeFailedValidation = vi.fn()
    emitter.on(
      'increase-unlock-time-failed-validation',
      increaseUnlockTimeFailedValidation,
    )

    await promise

    expect(increaseUnlockTimeFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'new unlock time must be greater than current unlock time',
    )
  })

  it('should successfully increase unlock time', async function () {
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'success',
    })

    const { emitter, promise } = increaseUnlockTime(validParameters)

    const preIncreaseUnlockTime = vi.fn()
    const userSignedIncreaseUnlockTime = vi.fn()
    const increaseUnlockTimeTransactionSucceeded = vi.fn()
    const increaseUnlockTimeSettled = vi.fn()

    emitter.on('pre-increase-unlock-time', preIncreaseUnlockTime)
    emitter.on('user-signed-increase-unlock-time', userSignedIncreaseUnlockTime)
    emitter.on(
      'increase-unlock-time-transaction-succeeded',
      increaseUnlockTimeTransactionSucceeded,
    )
    emitter.on('increase-unlock-time-settled', increaseUnlockTimeSettled)

    await promise

    expect(preIncreaseUnlockTime).toHaveBeenCalledOnce()
    expect(userSignedIncreaseUnlockTime).toHaveBeenCalledWith(zeroHash)
    expect(increaseUnlockTimeTransactionSucceeded).toHaveBeenCalled()
    expect(increaseUnlockTimeSettled).toHaveBeenCalledOnce()

    expect(writeContract).toHaveBeenCalledWith(
      validParameters.walletClient,
      expect.objectContaining({
        address: getVeHemiContractAddress(hemiSepolia.id),
        args: [
          validParameters.tokenId,
          BigInt(validParameters.lockDurationInSeconds),
        ],
        functionName: 'increaseUnlockTime',
      }),
    )
  })

  it('should handle user rejecting increase unlock time', async function () {
    vi.mocked(writeContract).mockRejectedValue(new Error('User rejected'))

    const { emitter, promise } = increaseUnlockTime(validParameters)

    const userSigningIncreaseUnlockTimeError = vi.fn()
    const increaseUnlockTimeTransactionSucceeded = vi.fn()
    const increaseUnlockTimeSettled = vi.fn()

    emitter.on(
      'user-signing-increase-unlock-time-error',
      userSigningIncreaseUnlockTimeError,
    )
    emitter.on(
      'increase-unlock-time-transaction-succeeded',
      increaseUnlockTimeTransactionSucceeded,
    )
    emitter.on('increase-unlock-time-settled', increaseUnlockTimeSettled)

    await promise

    expect(userSigningIncreaseUnlockTimeError).toHaveBeenCalledOnce()
    expect(increaseUnlockTimeTransactionSucceeded).not.toHaveBeenCalled()
    expect(increaseUnlockTimeSettled).toHaveBeenCalledOnce()
  })

  it('should handle increase unlock time transaction failure', async function () {
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'reverted',
    })

    const { emitter, promise } = increaseUnlockTime(validParameters)

    const increaseUnlockTimeTransactionReverted = vi.fn()
    const increaseUnlockTimeTransactionSucceeded = vi.fn()
    const increaseUnlockTimeSettled = vi.fn()

    emitter.on(
      'increase-unlock-time-transaction-reverted',
      increaseUnlockTimeTransactionReverted,
    )
    emitter.on(
      'increase-unlock-time-transaction-succeeded',
      increaseUnlockTimeTransactionSucceeded,
    )
    emitter.on('increase-unlock-time-settled', increaseUnlockTimeSettled)

    await promise

    expect(increaseUnlockTimeTransactionReverted).toHaveBeenCalled()
    expect(increaseUnlockTimeTransactionSucceeded).not.toHaveBeenCalled()
    expect(increaseUnlockTimeSettled).toHaveBeenCalledOnce()
  })

  it('should handle increase unlock time failure during waitForTransactionReceipt', async function () {
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(
      new Error('Network error'),
    )

    const { emitter, promise } = increaseUnlockTime(validParameters)

    const increaseUnlockTimeFailed = vi.fn()
    const increaseUnlockTimeSettled = vi.fn()

    emitter.on('increase-unlock-time-failed', increaseUnlockTimeFailed)
    emitter.on('increase-unlock-time-settled', increaseUnlockTimeSettled)

    await promise

    expect(increaseUnlockTimeFailed).toHaveBeenCalledOnce()
    expect(increaseUnlockTimeSettled).toHaveBeenCalledOnce()
  })

  it('should handle wallet client without chain', async function () {
    const { emitter, promise } = increaseUnlockTime({
      ...validParameters,
      walletClient: {},
    })

    const increaseUnlockTimeFailedValidation = vi.fn()
    emitter.on(
      'increase-unlock-time-failed-validation',
      increaseUnlockTimeFailedValidation,
    )

    await promise

    expect(increaseUnlockTimeFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'wallet client chain is not defined',
    )
  })

  it('should handle getLockedBalance failure', async function () {
    vi.mocked(getLockedBalance).mockRejectedValue(new Error('Contract error'))

    const { emitter, promise } = increaseUnlockTime(validParameters)

    const increaseUnlockTimeFailedValidation = vi.fn()
    emitter.on(
      'increase-unlock-time-failed-validation',
      increaseUnlockTimeFailedValidation,
    )

    await promise

    expect(increaseUnlockTimeFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'failed to check lock status',
    )
  })

  it('should handle lock duration too long', async function () {
    const { emitter, promise } = increaseUnlockTime({
      ...validParameters,
      lockDurationInSeconds: 5 * 365 * 24 * 60 * 60, // 5 years (exceeds maximum)
    })

    const increaseUnlockTimeFailedValidation = vi.fn()
    emitter.on(
      'increase-unlock-time-failed-validation',
      increaseUnlockTimeFailedValidation,
    )

    await promise

    expect(increaseUnlockTimeFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'lock duration is too long (maximum 4 years)',
    )
  })

  it('should handle unexpected errors', async function () {
    // Force an unexpected error by making writeContract throw after validation passes
    vi.mocked(writeContract).mockImplementation(function () {
      throw new Error('Unexpected error')
    })

    const { emitter, promise } = increaseUnlockTime(validParameters)

    const unexpectedError = vi.fn()
    const increaseUnlockTimeSettled = vi.fn()

    emitter.on('unexpected-error', unexpectedError)
    emitter.on('increase-unlock-time-settled', increaseUnlockTimeSettled)

    await promise

    expect(unexpectedError).toHaveBeenCalledOnce()
    expect(increaseUnlockTimeSettled).toHaveBeenCalledOnce()
  })
})
