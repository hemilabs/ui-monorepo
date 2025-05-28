import { PublicClient, WalletClient, zeroAddress, zeroHash } from 'viem'
import { getWithdrawals, getWithdrawalStatus } from 'viem/op-stack'
import { describe, it, expect, vi } from 'vitest'

import { finalizeWithdrawal } from '../src/finalizeWithdrawal'

vi.mock('viem/op-stack', async function (importOriginal) {
  const opStack = (await importOriginal()) as object
  return {
    ...opStack,
    getWithdrawals: vi.fn(),
    getWithdrawalStatus: vi.fn(),
  }
})

const createL2PublicClient = ({
  getTransactionReceipt = vi.fn().mockResolvedValue({ status: 'success' }),
} = {}): PublicClient =>
  ({
    getTransactionReceipt,
  }) as PublicClient

const createL1WalletClient = function ({
  finalizeWithdrawal: finalize = vi.fn().mockResolvedValue(zeroHash),
  waitForTransactionReceipt = vi.fn().mockResolvedValue({ status: 'success' }),
} = {}): WalletClient {
  const mockClient = {
    extend: vi
      .fn()
      .mockImplementation(actions => ({ ...mockClient, ...actions })),
    finalizeWithdrawal: finalize,
    waitForTransactionReceipt,
  }
  return mockClient as WalletClient
}

const validParameters = {
  account: zeroAddress,
  l1WalletClient: createL1WalletClient(),
  l2PublicClient: createL2PublicClient(),
  withdrawalTransactionHash: zeroHash,
}

describe('finalizeWithdrawal', function () {
  it('should emit "finalize-failed-validation" if the withdrawal transaction hash is not a valid hash', async function () {
    const { emitter, promise } = finalizeWithdrawal({
      ...validParameters,
      withdrawalTransactionHash: 'invalid-hash',
    })

    const failedValidation = vi.fn()
    const onSettled = vi.fn()

    emitter.on('finalize-failed-validation', failedValidation)
    emitter.on('finalize-settled', onSettled)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'invalid withdrawal transaction hash',
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "finalize-failed-validation" if the account is not a valid address', async function () {
    const { emitter, promise } = finalizeWithdrawal({
      ...validParameters,
      account: 123,
    })

    const failedValidation = vi.fn()
    const onSettled = vi.fn()

    emitter.on('finalize-failed-validation', failedValidation)
    emitter.on('finalize-settled', onSettled)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'account is not a valid address',
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "finalize-failed-validation" if the transaction receipt was not found', async function () {
    const { emitter, promise } = finalizeWithdrawal({
      ...validParameters,
      l2PublicClient: createL2PublicClient({
        getTransactionReceipt: vi.fn().mockResolvedValue(null),
      }),
    })

    const failedValidation = vi.fn()
    const onSettled = vi.fn()

    emitter.on('finalize-failed-validation', failedValidation)
    emitter.on('finalize-settled', onSettled)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'Invalid or unsuccessful transaction receipt',
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "finalize-failed-validation" if the withdrawal transaction reverted', async function () {
    const { emitter, promise } = finalizeWithdrawal({
      ...validParameters,
      l2PublicClient: createL2PublicClient({
        getTransactionReceipt: vi
          .fn()
          .mockResolvedValue({ status: 'reverted' }),
      }),
    })

    const failedValidation = vi.fn()
    const onSettled = vi.fn()

    emitter.on('finalize-failed-validation', failedValidation)
    emitter.on('finalize-settled', onSettled)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'Invalid or unsuccessful transaction receipt',
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "finalize-failed-validation" if getWithdrawalStatus does not return "ready-to-finalize"', async function () {
    const withdrawalStatus = 'ready-to-prove'
    const { emitter, promise } = finalizeWithdrawal(validParameters)
    vi.mocked(getWithdrawalStatus).mockResolvedValue(withdrawalStatus)

    const failedValidation = vi.fn()
    const onSettled = vi.fn()

    emitter.on('finalize-failed-validation', failedValidation)
    emitter.on('finalize-settled', onSettled)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      `Withdrawal status is not ready-to-finalize, current status: ${withdrawalStatus}`,
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "finalize-failed-validation" if it fails to get Withdrawal status', async function () {
    const { emitter, promise } = finalizeWithdrawal(validParameters)
    vi.mocked(getWithdrawalStatus).mockRejectedValue(new Error())

    const failedValidation = vi.fn()
    const onSettled = vi.fn()

    emitter.on('finalize-failed-validation', failedValidation)
    emitter.on('finalize-settled', onSettled)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'Failed to get Withdrawal status',
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "user-signed-finalize-error" if the user rejects signing the finalize transaction', async function () {
    const withdrawal = {}
    const l1WalletClient = createL1WalletClient({
      finalizeWithdrawal: vi.fn().mockRejectedValue(new Error('User rejected')),
    })
    vi.mocked(getWithdrawalStatus).mockResolvedValue('ready-to-finalize')
    vi.mocked(getWithdrawals).mockReturnValue([withdrawal])

    const { emitter, promise } = finalizeWithdrawal({
      ...validParameters,
      l1WalletClient,
    })

    const onPreFinalize = vi.fn()
    const onSigningError = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-finalize', onPreFinalize)
    emitter.on('user-signed-finalize-error', onSigningError)
    emitter.on('finalize-settled', onSettled)

    await promise

    expect(onPreFinalize).toHaveBeenCalledOnce()
    expect(onSigningError).toHaveBeenCalledExactlyOnceWith(expect.any(Error))
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "finalize-transaction-succeeded" if the finalize transaction is successful', async function () {
    const finalizeReceipt = { status: 'success' }
    const withdrawal = {}

    const l1WalletClient = createL1WalletClient({
      waitForTransactionReceipt: vi.fn().mockResolvedValue(finalizeReceipt),
    })
    vi.mocked(getWithdrawalStatus).mockResolvedValue('ready-to-finalize')
    vi.mocked(getWithdrawals).mockReturnValue([withdrawal])

    const { emitter, promise } = finalizeWithdrawal({
      ...validParameters,
      l1WalletClient,
    })

    const onPreFinalize = vi.fn()
    const onFinalizeReverted = vi.fn()
    const onFinalizeSucceeded = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-finalize', onPreFinalize)
    emitter.on('finalize-transaction-reverted', onFinalizeReverted)
    emitter.on('finalize-transaction-succeeded', onFinalizeSucceeded)
    emitter.on('finalize-settled', onSettled)

    await promise

    expect(onPreFinalize).toHaveBeenCalledOnce()
    expect(onFinalizeReverted).not.toHaveBeenCalled()
    expect(onFinalizeSucceeded).toHaveBeenCalledExactlyOnceWith(finalizeReceipt)
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "finalize-transaction-reverted" if the finalize transaction reverts', async function () {
    const finalizeReceipt = { status: 'reverted' }
    const withdrawal = {}

    const l1WalletClient = createL1WalletClient({
      waitForTransactionReceipt: vi.fn().mockResolvedValue(finalizeReceipt),
    })
    vi.mocked(getWithdrawalStatus).mockResolvedValue('ready-to-finalize')
    vi.mocked(getWithdrawals).mockReturnValue([withdrawal])

    const { emitter, promise } = finalizeWithdrawal({
      ...validParameters,
      l1WalletClient,
    })

    const onPreFinalize = vi.fn()
    const onFinalizeReverted = vi.fn()
    const onFinalizeSuccess = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-finalize', onPreFinalize)
    emitter.on('finalize-transaction-reverted', onFinalizeReverted)
    emitter.on('finalize-transaction-succeeded', onFinalizeSuccess)
    emitter.on('finalize-settled', onSettled)

    await promise

    expect(onPreFinalize).toHaveBeenCalledOnce()
    expect(onFinalizeReverted).toHaveBeenCalledExactlyOnceWith(finalizeReceipt)
    expect(onFinalizeSuccess).not.toHaveBeenCalled()
    expect(onSettled).toHaveBeenCalledOnce()
  })
})
