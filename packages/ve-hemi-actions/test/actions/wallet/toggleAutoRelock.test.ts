import { hemiSepolia } from 'hemi-viem'
import { zeroAddress, zeroHash } from 'viem'
import { waitForTransactionReceipt, writeContract } from 'viem/actions'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { toggleAutoRelock } from '../../../actions'
import { getAutoRelockStatus, getOwnerOf } from '../../../actions/public/veHemi'
import {
  getVeHemiContractAddress,
  MinLockDurationSeconds,
  SixDaysSeconds,
} from '../../../constants'

vi.mock('viem/actions', () => ({
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}))

vi.mock('../../../actions/public/veHemi', () => ({
  getAutoRelockStatus: vi.fn(),
  getOwnerOf: vi.fn(),
}))

const validParameters = {
  account: '0x1234567890123456789012345678901234567890' as const,
  enable: true,
  tokenId: BigInt(1),
  walletClient: { chain: hemiSepolia },
}

const grid = SixDaysSeconds * 3000
const status = (overrides = {}) => [
  {
    effectiveLockEnd: BigInt(grid + MinLockDurationSeconds * 10),
    isAutoRelockEnabled: false,
    ...overrides,
  },
]

describe('toggleAutoRelock', function () {
  beforeEach(function () {
    vi.useFakeTimers()
    vi.setSystemTime(grid * 1000)
    vi.mocked(getOwnerOf).mockResolvedValue(validParameters.account)
    vi.mocked(getAutoRelockStatus).mockResolvedValue(status())
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'success',
    })
  })

  afterEach(function () {
    vi.useRealTimers()
  })

  it('should emit "auto-relock-failed-validation" if the account is not a valid address', async function () {
    const { emitter, promise } = toggleAutoRelock({
      ...validParameters,
      account: 'invalid-address',
    })

    const failed = vi.fn()
    emitter.on('auto-relock-failed-validation', failed)
    await promise

    expect(failed).toHaveBeenCalledExactlyOnceWith(
      'account is not a valid address',
    )
    expect(writeContract).not.toHaveBeenCalled()
  })

  it('should emit "auto-relock-failed-validation" if the wallet client has no chain', async function () {
    const { emitter, promise } = toggleAutoRelock({
      ...validParameters,
      walletClient: {},
    })

    const failed = vi.fn()
    emitter.on('auto-relock-failed-validation', failed)
    await promise

    expect(failed).toHaveBeenCalledExactlyOnceWith(
      'wallet client chain is not defined',
    )
  })

  it('should refuse a position owned by someone else', async function () {
    vi.mocked(getOwnerOf).mockResolvedValue(zeroAddress)

    const { emitter, promise } = toggleAutoRelock(validParameters)
    const failed = vi.fn()
    emitter.on('auto-relock-failed-validation', failed)
    await promise

    expect(failed).toHaveBeenCalledExactlyOnceWith('not token owner')
  })

  it('should refuse enabling what is already enabled', async function () {
    vi.mocked(getAutoRelockStatus).mockResolvedValue(
      status({ isAutoRelockEnabled: true }),
    )

    const { emitter, promise } = toggleAutoRelock(validParameters)
    const failed = vi.fn()
    emitter.on('auto-relock-failed-validation', failed)
    await promise

    expect(failed).toHaveBeenCalledExactlyOnceWith(
      'auto-relock already enabled',
    )
  })

  it('should refuse disabling what is not enabled', async function () {
    const { emitter, promise } = toggleAutoRelock({
      ...validParameters,
      enable: false,
    })

    const failed = vi.fn()
    emitter.on('auto-relock-failed-validation', failed)
    await promise

    expect(failed).toHaveBeenCalledExactlyOnceWith('auto-relock not enabled')
  })

  it('should refuse a lock with less than the minimum left', async function () {
    vi.mocked(getAutoRelockStatus).mockResolvedValue(
      status({
        effectiveLockEnd: BigInt(grid + MinLockDurationSeconds - 1),
      }),
    )

    const { emitter, promise } = toggleAutoRelock(validParameters)
    const failed = vi.fn()
    emitter.on('auto-relock-failed-validation', failed)
    await promise

    expect(failed).toHaveBeenCalledExactlyOnceWith(
      'lock too short for auto-relock',
    )
  })

  it('should accept a lock sitting exactly at the minimum', async function () {
    vi.mocked(getAutoRelockStatus).mockResolvedValue(
      status({ effectiveLockEnd: BigInt(grid + MinLockDurationSeconds) }),
    )

    const { emitter, promise } = toggleAutoRelock(validParameters)
    const failed = vi.fn()
    emitter.on('auto-relock-failed-validation', failed)
    await promise

    expect(failed).not.toHaveBeenCalled()
    expect(writeContract).toHaveBeenCalledOnce()
  })

  it('should refuse a lock that already expired', async function () {
    vi.mocked(getAutoRelockStatus).mockResolvedValue(
      status({ effectiveLockEnd: BigInt(0) }),
    )

    const { emitter, promise } = toggleAutoRelock(validParameters)
    const failed = vi.fn()
    const unexpected = vi.fn()
    emitter.on('auto-relock-failed-validation', failed)
    emitter.on('unexpected-error', unexpected)
    await promise

    expect(failed).toHaveBeenCalledExactlyOnceWith('lock expired')
    expect(unexpected).not.toHaveBeenCalled()
  })

  it('should send enableAutoRelock and walk the happy path', async function () {
    const { emitter, promise } = toggleAutoRelock(validParameters)

    const pre = vi.fn()
    const signed = vi.fn()
    const succeeded = vi.fn()
    const settled = vi.fn()
    emitter.on('pre-auto-relock', pre)
    emitter.on('user-signed-auto-relock', signed)
    emitter.on('auto-relock-transaction-succeeded', succeeded)
    emitter.on('auto-relock-settled', settled)
    await promise

    expect(pre).toHaveBeenCalledOnce()
    expect(signed).toHaveBeenCalledExactlyOnceWith(zeroHash)
    expect(succeeded).toHaveBeenCalledOnce()
    expect(settled).toHaveBeenCalledOnce()
    expect(writeContract).toHaveBeenCalledWith(
      validParameters.walletClient,
      expect.objectContaining({
        address: getVeHemiContractAddress(hemiSepolia.id),
        args: [validParameters.tokenId],
        functionName: 'enableAutoRelock',
      }),
    )
  })

  it('should send disableAutoRelock when turning it off', async function () {
    vi.mocked(getAutoRelockStatus).mockResolvedValue(
      status({ isAutoRelockEnabled: true }),
    )

    const { promise } = toggleAutoRelock({
      ...validParameters,
      enable: false,
    })
    await promise

    expect(writeContract).toHaveBeenCalledWith(
      validParameters.walletClient,
      expect.objectContaining({ functionName: 'disableAutoRelock' }),
    )
  })

  it('should emit "user-signing-auto-relock-error" when the user rejects', async function () {
    const error = new Error('User rejected')
    vi.mocked(writeContract).mockRejectedValue(error)

    const { emitter, promise } = toggleAutoRelock(validParameters)
    const rejected = vi.fn()
    const signed = vi.fn()
    emitter.on('user-signing-auto-relock-error', rejected)
    emitter.on('user-signed-auto-relock', signed)
    await promise

    expect(rejected).toHaveBeenCalledExactlyOnceWith(error)
    expect(signed).not.toHaveBeenCalled()
  })

  it('should emit "auto-relock-transaction-reverted" on a reverted receipt', async function () {
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'reverted',
    })

    const { emitter, promise } = toggleAutoRelock(validParameters)
    const reverted = vi.fn()
    emitter.on('auto-relock-transaction-reverted', reverted)
    await promise

    expect(reverted).toHaveBeenCalledOnce()
  })

  it('should emit "auto-relock-failed" when the receipt never arrives', async function () {
    const error = new Error('timeout')
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(error)

    const { emitter, promise } = toggleAutoRelock(validParameters)
    const failed = vi.fn()
    emitter.on('auto-relock-failed', failed)
    await promise

    expect(failed).toHaveBeenCalledExactlyOnceWith(error)
  })

  it('should fall back to a reason when the reads reject', async function () {
    vi.mocked(getOwnerOf).mockRejectedValue(new Error('rpc down'))

    const { emitter, promise } = toggleAutoRelock(validParameters)
    const failed = vi.fn()
    emitter.on('auto-relock-failed-validation', failed)
    await promise

    expect(failed).toHaveBeenCalledExactlyOnceWith(
      'failed to check lock status',
    )
  })
})
