import { hemiSepolia } from 'hemi-viem'
import { zeroAddress, zeroHash } from 'viem'
import { waitForTransactionReceipt, writeContract } from 'viem/actions'
import {
  approveErc20Token,
  getErc20TokenAllowance,
  getErc20TokenBalance,
} from 'viem-erc20/actions'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { increaseAmount } from '../../../actions'
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

vi.mock('viem-erc20/actions', () => ({
  approveErc20Token: vi.fn(),
  getErc20TokenAllowance: vi.fn(),
  getErc20TokenBalance: vi.fn(),
}))

vi.mock('../../../actions/public/veHemi', () => ({
  getHemiTokenAddress: vi.fn(),
  getLockedBalance: vi.fn(),
  memoizedGetHemiTokenAddress: vi.fn(),
}))

const validParameters = {
  account: '0x1234567890123456789012345678901234567890' as const,
  additionalAmount: BigInt(100),
  tokenId: BigInt(1),
  walletClient: { chain: hemiSepolia },
}

describe('increaseAmount', function () {
  beforeEach(function () {
    vi.mocked(getHemiTokenAddress).mockResolvedValue(zeroAddress)
    vi.mocked(memoizedGetHemiTokenAddress).mockResolvedValue(zeroAddress)

    // Mock getLockedBalance to return a future expiry date (not expired)
    const futureTimestamp = BigInt(Math.floor(Date.now() / 1000) + 86400) // 1 day from now
    vi.mocked(getLockedBalance).mockResolvedValue({
      amount: BigInt(500),
      end: futureTimestamp,
    })
  })

  it('should emit "increase-amount-failed-validation" if the account is not a valid address', async function () {
    const { emitter, promise } = increaseAmount({
      ...validParameters,
      account: 'invalid-address',
    })

    const increaseAmountFailedValidation = vi.fn()
    emitter.on(
      'increase-amount-failed-validation',
      increaseAmountFailedValidation,
    )

    await promise

    expect(increaseAmountFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'account is not a valid address',
    )
  })

  it('should emit "increase-amount-failed-validation" if additionalAmount is zero', async function () {
    const { emitter, promise } = increaseAmount({
      ...validParameters,
      additionalAmount: BigInt(0),
    })

    const increaseAmountFailedValidation = vi.fn()
    emitter.on(
      'increase-amount-failed-validation',
      increaseAmountFailedValidation,
    )

    await promise

    expect(increaseAmountFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'amount cannot be zero',
    )
  })

  it('should emit "increase-amount-failed-validation" if tokenId is zero', async function () {
    const { emitter, promise } = increaseAmount({
      ...validParameters,
      tokenId: BigInt(0),
    })

    const increaseAmountFailedValidation = vi.fn()
    emitter.on(
      'increase-amount-failed-validation',
      increaseAmountFailedValidation,
    )

    await promise

    expect(increaseAmountFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'invalid token ID',
    )
  })

  it('should emit "increase-amount-failed-validation" if user has insufficient balance', async function () {
    vi.mocked(getErc20TokenBalance).mockResolvedValue(BigInt(50))

    const { emitter, promise } = increaseAmount(validParameters)

    const increaseAmountFailedValidation = vi.fn()
    emitter.on(
      'increase-amount-failed-validation',
      increaseAmountFailedValidation,
    )

    await promise

    expect(increaseAmountFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'insufficient balance',
    )
  })

  it('should emit "increase-amount-failed-validation" if lock is expired', async function () {
    vi.mocked(getErc20TokenBalance).mockResolvedValue(BigInt(1000))

    // Mock expired lock (end timestamp in the past)
    const pastTimestamp = BigInt(Math.floor(Date.now() / 1000) - 86400) // 1 day ago
    vi.mocked(getLockedBalance).mockResolvedValue({
      amount: BigInt(500),
      end: pastTimestamp,
    })

    const { emitter, promise } = increaseAmount(validParameters)

    const increaseAmountFailedValidation = vi.fn()
    emitter.on(
      'increase-amount-failed-validation',
      increaseAmountFailedValidation,
    )

    await promise

    expect(increaseAmountFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'lock already expired',
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

    const { emitter, promise } = increaseAmount(validParameters)

    const preApprove = vi.fn()
    const userSignedApprove = vi.fn()
    const approveTransactionSucceeded = vi.fn()
    const preIncreaseAmount = vi.fn()
    const increaseAmountSettled = vi.fn()

    emitter.on('pre-approve', preApprove)
    emitter.on('user-signed-approve', userSignedApprove)
    emitter.on('approve-transaction-succeeded', approveTransactionSucceeded)
    emitter.on('pre-increase-amount', preIncreaseAmount)
    emitter.on('increase-amount-settled', increaseAmountSettled)

    await promise

    expect(preApprove).toHaveBeenCalledOnce()
    expect(userSignedApprove).toHaveBeenCalledWith(zeroHash)
    expect(approveTransactionSucceeded).toHaveBeenCalled()
    expect(preIncreaseAmount).toHaveBeenCalledOnce()
    expect(increaseAmountSettled).toHaveBeenCalledOnce()
    expect(approveErc20Token).toHaveBeenCalledWith(
      validParameters.walletClient,
      expect.objectContaining({
        amount: validParameters.additionalAmount,
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

    const { emitter, promise } = increaseAmount({
      ...validParameters,
      approvalAdditionalAmount: customApprovalAmount,
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

  it('should successfully increase amount after approval', async function () {
    vi.mocked(getErc20TokenBalance).mockResolvedValue(
      validParameters.additionalAmount,
    )
    vi.mocked(getErc20TokenAllowance).mockResolvedValue(
      BigInt(validParameters.additionalAmount),
    )
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'success',
    })

    const { emitter, promise } = increaseAmount(validParameters)

    const preIncreaseAmount = vi.fn()
    const userSignedIncreaseAmount = vi.fn()
    const increaseAmountTransactionSucceeded = vi.fn()
    const increaseAmountSettled = vi.fn()

    emitter.on('pre-increase-amount', preIncreaseAmount)
    emitter.on('user-signed-increase-amount', userSignedIncreaseAmount)
    emitter.on(
      'increase-amount-transaction-succeeded',
      increaseAmountTransactionSucceeded,
    )
    emitter.on('increase-amount-settled', increaseAmountSettled)

    await promise

    expect(preIncreaseAmount).toHaveBeenCalledOnce()
    expect(userSignedIncreaseAmount).toHaveBeenCalledWith(zeroHash)
    expect(increaseAmountTransactionSucceeded).toHaveBeenCalled()
    expect(increaseAmountSettled).toHaveBeenCalledOnce()

    expect(writeContract).toHaveBeenCalledWith(
      validParameters.walletClient,
      expect.objectContaining({
        address: getVeHemiContractAddress(hemiSepolia.id),
        args: [validParameters.tokenId, validParameters.additionalAmount],
        functionName: 'increaseAmount',
      }),
    )
  })

  it('should skip approval if allowance is sufficient', async function () {
    vi.mocked(getErc20TokenBalance).mockResolvedValue(
      validParameters.additionalAmount,
    )
    vi.mocked(getErc20TokenAllowance).mockResolvedValue(
      validParameters.additionalAmount + BigInt(1),
    )
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'success',
    })

    const { emitter, promise } = increaseAmount(validParameters)

    const preApprove = vi.fn()
    const preIncreaseAmount = vi.fn()
    const increaseAmountSettled = vi.fn()

    emitter.on('pre-approve', preApprove)
    emitter.on('pre-increase-amount', preIncreaseAmount)
    emitter.on('increase-amount-settled', increaseAmountSettled)

    await promise

    expect(preApprove).not.toHaveBeenCalled()
    expect(preIncreaseAmount).toHaveBeenCalledOnce()
    expect(increaseAmountSettled).toHaveBeenCalledOnce()
    expect(approveErc20Token).not.toHaveBeenCalled()
  })

  it('should handle approve transaction failure', async function () {
    vi.mocked(getErc20TokenBalance).mockResolvedValue(BigInt(1000))
    vi.mocked(getErc20TokenAllowance).mockResolvedValue(BigInt(0))
    vi.mocked(approveErc20Token).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValueOnce({
      status: 'reverted',
    })

    const { emitter, promise } = increaseAmount(validParameters)

    const approveTransactionReverted = vi.fn()
    const preIncreaseAmount = vi.fn()
    const increaseAmountSettled = vi.fn()

    emitter.on('approve-transaction-reverted', approveTransactionReverted)
    emitter.on('pre-increase-amount', preIncreaseAmount)
    emitter.on('increase-amount-settled', increaseAmountSettled)

    await promise

    expect(approveTransactionReverted).toHaveBeenCalled()
    expect(preIncreaseAmount).not.toHaveBeenCalled()
    expect(increaseAmountSettled).toHaveBeenCalledOnce()
  })

  it('should handle user rejecting approval', async function () {
    vi.mocked(getErc20TokenBalance).mockResolvedValue(BigInt(1000))
    vi.mocked(getErc20TokenAllowance).mockResolvedValue(BigInt(0))
    vi.mocked(approveErc20Token).mockRejectedValue(new Error('User rejected'))

    const { emitter, promise } = increaseAmount(validParameters)

    const userSigningApproveError = vi.fn()
    const preIncreaseAmount = vi.fn()
    const increaseAmountSettled = vi.fn()

    emitter.on('user-signing-approve-error', userSigningApproveError)
    emitter.on('pre-increase-amount', preIncreaseAmount)
    emitter.on('increase-amount-settled', increaseAmountSettled)

    await promise

    expect(userSigningApproveError).toHaveBeenCalledOnce()
    expect(preIncreaseAmount).not.toHaveBeenCalled()
    expect(increaseAmountSettled).toHaveBeenCalledOnce()
  })

  it('should handle user rejecting increase amount', async function () {
    vi.mocked(getErc20TokenBalance).mockResolvedValue(BigInt(1000))
    vi.mocked(getErc20TokenAllowance).mockResolvedValue(BigInt(200))
    vi.mocked(writeContract).mockRejectedValue(new Error('User rejected'))

    const { emitter, promise } = increaseAmount(validParameters)

    const userSigningIncreaseAmountError = vi.fn()
    const increaseAmountTransactionSucceeded = vi.fn()
    const increaseAmountSettled = vi.fn()

    emitter.on(
      'user-signing-increase-amount-error',
      userSigningIncreaseAmountError,
    )
    emitter.on(
      'increase-amount-transaction-succeeded',
      increaseAmountTransactionSucceeded,
    )
    emitter.on('increase-amount-settled', increaseAmountSettled)

    await promise

    expect(userSigningIncreaseAmountError).toHaveBeenCalledOnce()
    expect(increaseAmountTransactionSucceeded).not.toHaveBeenCalled()
    expect(increaseAmountSettled).toHaveBeenCalledOnce()
  })

  it('should handle increase amount transaction failure', async function () {
    vi.mocked(getErc20TokenBalance).mockResolvedValue(BigInt(1000))
    vi.mocked(getErc20TokenAllowance).mockResolvedValue(BigInt(200))
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'reverted',
    })

    const { emitter, promise } = increaseAmount(validParameters)

    const increaseAmountTransactionReverted = vi.fn()
    const increaseAmountTransactionSucceeded = vi.fn()
    const increaseAmountSettled = vi.fn()

    emitter.on(
      'increase-amount-transaction-reverted',
      increaseAmountTransactionReverted,
    )
    emitter.on(
      'increase-amount-transaction-succeeded',
      increaseAmountTransactionSucceeded,
    )
    emitter.on('increase-amount-settled', increaseAmountSettled)

    await promise

    expect(increaseAmountTransactionReverted).toHaveBeenCalled()
    expect(increaseAmountTransactionSucceeded).not.toHaveBeenCalled()
    expect(increaseAmountSettled).toHaveBeenCalledOnce()
  })

  it('should handle approval failure during waitForTransactionReceipt', async function () {
    vi.mocked(getErc20TokenBalance).mockResolvedValue(BigInt(1000))
    vi.mocked(getErc20TokenAllowance).mockResolvedValue(BigInt(0))
    vi.mocked(approveErc20Token).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(
      new Error('Network error'),
    )

    const { emitter, promise } = increaseAmount(validParameters)

    const approveFailed = vi.fn()
    const increaseAmountSettled = vi.fn()

    emitter.on('approve-failed', approveFailed)
    emitter.on('increase-amount-settled', increaseAmountSettled)

    await promise

    expect(approveFailed).toHaveBeenCalledOnce()
    expect(increaseAmountSettled).toHaveBeenCalledOnce()
  })

  it('should handle increase amount failure during waitForTransactionReceipt', async function () {
    vi.mocked(getErc20TokenBalance).mockResolvedValue(BigInt(1000))
    vi.mocked(getErc20TokenAllowance).mockResolvedValue(BigInt(200))
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(
      new Error('Network error'),
    )

    const { emitter, promise } = increaseAmount(validParameters)

    const increaseAmountFailed = vi.fn()
    const increaseAmountSettled = vi.fn()

    emitter.on('increase-amount-failed', increaseAmountFailed)
    emitter.on('increase-amount-settled', increaseAmountSettled)

    await promise

    expect(increaseAmountFailed).toHaveBeenCalledOnce()
    expect(increaseAmountSettled).toHaveBeenCalledOnce()
  })

  it('should handle wallet client without chain', async function () {
    const { emitter, promise } = increaseAmount({
      ...validParameters,
      walletClient: {},
    })

    const increaseAmountFailedValidation = vi.fn()
    emitter.on(
      'increase-amount-failed-validation',
      increaseAmountFailedValidation,
    )

    await promise

    expect(increaseAmountFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'wallet client chain is not defined',
    )
  })

  it('should handle balance check failure', async function () {
    vi.mocked(getErc20TokenBalance).mockRejectedValue(new Error('RPC error'))

    const { emitter, promise } = increaseAmount(validParameters)

    const increaseAmountFailedValidation = vi.fn()
    emitter.on(
      'increase-amount-failed-validation',
      increaseAmountFailedValidation,
    )

    await promise

    expect(increaseAmountFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'failed to check balance',
    )
  })

  it('should handle getLockedBalance failure', async function () {
    vi.mocked(getErc20TokenBalance).mockResolvedValue(BigInt(1000))
    vi.mocked(getLockedBalance).mockRejectedValue(new Error('Contract error'))

    const { emitter, promise } = increaseAmount(validParameters)

    const increaseAmountFailedValidation = vi.fn()
    emitter.on(
      'increase-amount-failed-validation',
      increaseAmountFailedValidation,
    )

    await promise

    expect(increaseAmountFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'failed to check balance',
    )
  })
})
