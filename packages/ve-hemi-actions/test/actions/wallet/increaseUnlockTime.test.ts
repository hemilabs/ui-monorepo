import { hemiSepolia } from 'hemi-viem'
import { zeroAddress, zeroHash } from 'viem'
import { waitForTransactionReceipt, writeContract } from 'viem/actions'
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest'

import { increaseUnlockTime } from '../../../actions'
import {
  getAutoRelockStatus,
  getHemiTokenAddress,
  memoizedGetHemiTokenAddress,
  getLockedBalance,
} from '../../../actions/public/veHemi'
import { getVeHemiContractAddress, SixDaysSeconds } from '../../../constants'

vi.mock('viem/actions', () => ({
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}))

vi.mock('../../../actions/public/veHemi', () => ({
  getAutoRelockStatus: vi.fn(),
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

    const futureTimestamp = BigInt(Math.floor(Date.now() / 1000) + 86400)
    vi.mocked(getLockedBalance).mockResolvedValue({
      amount: BigInt(500),
      end: futureTimestamp,
    })
    vi.mocked(getAutoRelockStatus).mockResolvedValue([
      { effectiveLockEnd: futureTimestamp, isAutoRelockEnabled: false },
    ])
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
    const pastTimestamp = BigInt(Math.floor(Date.now() / 1000) - 86400)
    vi.mocked(getAutoRelockStatus).mockResolvedValue([
      { effectiveLockEnd: pastTimestamp, isAutoRelockEnabled: false },
    ])

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
    const futureTimestamp = BigInt(Math.floor(Date.now() / 1000) + 86400 * 60)
    vi.mocked(getAutoRelockStatus).mockResolvedValue([
      { effectiveLockEnd: futureTimestamp, isAutoRelockEnabled: false },
    ])

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

  describe('when the new unlock time is rounded down to the epoch grid', function () {
    const now = 1_800_000_000
    const end =
      Math.floor(now / SixDaysSeconds) * SixDaysSeconds + 10 * SixDaysSeconds

    beforeEach(function () {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(now * 1000)
      vi.mocked(getAutoRelockStatus).mockResolvedValue([
        { effectiveLockEnd: BigInt(end), isAutoRelockEnabled: false },
      ])
    })

    afterEach(function () {
      vi.useRealTimers()
    })

    it('should emit "increase-unlock-time-failed-validation" if it lands on the current unlock time', async function () {
      const { emitter, promise } = increaseUnlockTime({
        ...validParameters,
        lockDurationInSeconds: end + SixDaysSeconds - 1 - now,
      })

      const increaseUnlockTimeFailedValidation = vi.fn()
      emitter.on(
        'increase-unlock-time-failed-validation',
        increaseUnlockTimeFailedValidation,
      )

      await promise

      expect(
        increaseUnlockTimeFailedValidation,
      ).toHaveBeenCalledExactlyOnceWith(
        'new unlock time must be greater than current unlock time',
      )
      expect(writeContract).not.toHaveBeenCalled()
    })

    it('should increase unlock time if it lands on the next epoch', async function () {
      vi.mocked(writeContract).mockResolvedValue(zeroHash)
      vi.mocked(waitForTransactionReceipt).mockResolvedValue({
        status: 'success',
      })

      const { emitter, promise } = increaseUnlockTime({
        ...validParameters,
        lockDurationInSeconds: end + SixDaysSeconds - now,
      })

      const increaseUnlockTimeFailedValidation = vi.fn()
      emitter.on(
        'increase-unlock-time-failed-validation',
        increaseUnlockTimeFailedValidation,
      )

      await promise

      expect(increaseUnlockTimeFailedValidation).not.toHaveBeenCalled()
      expect(writeContract).toHaveBeenCalledOnce()
    })
  })

  it('should increase unlock time while auto-relock is enabled', async function () {
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'success',
    })
    vi.mocked(getLockedBalance).mockResolvedValue({
      amount: BigInt(500),
      end: BigInt(Math.floor(Date.now() / 1000) - 86400),
    })
    vi.mocked(getAutoRelockStatus).mockResolvedValue([
      {
        effectiveLockEnd: BigInt(Math.floor(Date.now() / 1000) + 86400),
        isAutoRelockEnabled: true,
      },
    ])

    const { emitter, promise } = increaseUnlockTime(validParameters)

    const increaseUnlockTimeFailedValidation = vi.fn()
    emitter.on(
      'increase-unlock-time-failed-validation',
      increaseUnlockTimeFailedValidation,
    )

    await promise

    expect(increaseUnlockTimeFailedValidation).not.toHaveBeenCalled()
    expect(writeContract).toHaveBeenCalledOnce()
  })

  it('should emit "increase-unlock-time-failed-validation" if the new unlock time only clears the stored end', async function () {
    vi.mocked(getLockedBalance).mockResolvedValue({
      amount: BigInt(500),
      end: BigInt(Math.floor(Date.now() / 1000) + 86400 * 10),
    })
    vi.mocked(getAutoRelockStatus).mockResolvedValue([
      {
        effectiveLockEnd: BigInt(Math.floor(Date.now() / 1000) + 86400 * 60),
        isAutoRelockEnabled: true,
      },
    ])

    const { emitter, promise } = increaseUnlockTime({
      ...validParameters,
      lockDurationInSeconds: 86400 * 30,
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
    expect(writeContract).not.toHaveBeenCalled()
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
