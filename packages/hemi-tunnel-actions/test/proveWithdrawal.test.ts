import { PublicClient, WalletClient, zeroAddress, zeroHash } from 'viem'
import { getWithdrawalStatus } from 'viem/op-stack'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { proveWithdrawal } from '../src/proveWithdrawal'

vi.mock('viem/op-stack', async function (importOriginal) {
  const opStack = (await importOriginal()) as object
  return {
    ...opStack,
    getWithdrawalStatus: vi.fn(),
  }
})

const createL2PublicClient = ({
  getTransactionReceipt = vi.fn().mockResolvedValue({ status: 'success' }),
  buildProveWithdrawal = vi.fn().mockResolvedValue({}),
} = {}): PublicClient =>
  ({
    extend: vi.fn().mockReturnValue({
      buildProveWithdrawal,
      getTransactionReceipt,
    }),
  }) as PublicClient

const createL1WalletClient = function ({
  proveWithdrawal: prove = vi.fn().mockResolvedValue(zeroHash),
  waitForTransactionReceipt = vi.fn().mockResolvedValue({ status: 'success' }),
  waitToProve = vi.fn().mockResolvedValue({ output: {}, withdrawal: {} }),
} = {}): WalletClient {
  const mockClient = {
    extend: vi
      .fn()
      .mockImplementation(actions => ({ ...mockClient, ...actions })),
    proveWithdrawal: prove,
    waitForTransactionReceipt,
    waitToProve,
  }
  return mockClient as WalletClient
}

const validParameters = {
  account: zeroAddress,
  l1WalletClient: createL1WalletClient(),
  l2PublicClient: createL2PublicClient(),
  withdrawalTransactionHash: zeroHash,
}

describe('proveWithdrawal', function () {
  beforeEach(function () {
    vi.clearAllMocks()
  })

  it('should emit "prove-failed-validation" if the withdrawal transaction hash is not a valid hash', async function () {
    const { emitter, promise } = proveWithdrawal({
      ...validParameters,
      withdrawalTransactionHash: 'invalid-hash',
    })

    const failedValidation = vi.fn()
    const onSettled = vi.fn()

    emitter.on('prove-failed-validation', failedValidation)
    emitter.on('prove-settled', onSettled)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'invalid withdrawal transaction hash',
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "prove-failed-validation" if the account is not a valid address', async function () {
    const { emitter, promise } = proveWithdrawal({
      ...validParameters,
      account: 123,
    })

    const failedValidation = vi.fn()
    const onSettled = vi.fn()

    emitter.on('prove-failed-validation', failedValidation)
    emitter.on('prove-settled', onSettled)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'account is not a valid address',
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "prove-failed-validation" if the transaction receipt was not found', async function () {
    const { emitter, promise } = proveWithdrawal({
      ...validParameters,
      l2PublicClient: createL2PublicClient({
        getTransactionReceipt: vi.fn().mockResolvedValue(null),
      }),
    })

    const failedValidation = vi.fn()
    const onSettled = vi.fn()

    emitter.on('prove-failed-validation', failedValidation)
    emitter.on('prove-settled', onSettled)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'Invalid or unsuccessful transaction receipt',
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "prove-failed-validation" if the transaction receipt status was reverted', async function () {
    const { emitter, promise } = proveWithdrawal({
      ...validParameters,
      l2PublicClient: createL2PublicClient({
        getTransactionReceipt: vi
          .fn()
          .mockResolvedValue({ status: 'reverted' }),
      }),
    })

    const failedValidation = vi.fn()
    const onSettled = vi.fn()

    emitter.on('prove-failed-validation', failedValidation)
    emitter.on('prove-settled', onSettled)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'Invalid or unsuccessful transaction receipt',
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "prove-failed-validation" if getWithdrawalStatus does not return "ready-to-prove"', async function () {
    const withdrawalStatus = 'not-ready-to-prove'
    const { emitter, promise } = proveWithdrawal(validParameters)
    vi.mocked(getWithdrawalStatus).mockResolvedValue(withdrawalStatus)

    const failedValidation = vi.fn()
    const onSettled = vi.fn()

    emitter.on('prove-failed-validation', failedValidation)
    emitter.on('prove-settled', onSettled)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      `Withdrawal status is not ready-to-prove, current status: ${withdrawalStatus}`,
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "prove-failed-validation" if it fails to get Withdrawal status', async function () {
    const { emitter, promise } = proveWithdrawal(validParameters)
    vi.mocked(getWithdrawalStatus).mockRejectedValue(new Error())

    const failedValidation = vi.fn()
    const onSettled = vi.fn()

    emitter.on('prove-failed-validation', failedValidation)
    emitter.on('prove-settled', onSettled)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'Failed to get Withdrawal status',
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "user-signed-prove-error" if the user rejects signing the prove transaction', async function () {
    const l1WalletClient = createL1WalletClient({
      proveWithdrawal: vi.fn().mockRejectedValue(new Error('User rejected')),
    })
    vi.mocked(getWithdrawalStatus).mockResolvedValue('ready-to-prove')

    const { emitter, promise } = proveWithdrawal({
      ...validParameters,
      l1WalletClient,
    })

    const onPreProve = vi.fn()
    const onSigningError = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-prove', onPreProve)
    emitter.on('user-signed-prove-error', onSigningError)
    emitter.on('prove-settled', onSettled)

    await promise

    expect(onPreProve).toHaveBeenCalledOnce()
    expect(onSigningError).toHaveBeenCalledExactlyOnceWith(expect.any(Error))
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "prove-transaction-succeeded" if the prove transaction is successful', async function () {
    const proveReceipt = { status: 'success' }

    const l1WalletClient = createL1WalletClient({
      waitForTransactionReceipt: vi.fn().mockResolvedValue(proveReceipt),
    })
    vi.mocked(getWithdrawalStatus).mockResolvedValue('ready-to-prove')

    const { emitter, promise } = proveWithdrawal({
      ...validParameters,
      l1WalletClient,
    })

    const onPreProve = vi.fn()
    const onProveSucceeded = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-prove', onPreProve)
    emitter.on('prove-transaction-succeeded', onProveSucceeded)
    emitter.on('prove-settled', onSettled)

    await promise

    expect(onPreProve).toHaveBeenCalledOnce()
    expect(onProveSucceeded).toHaveBeenCalledExactlyOnceWith(proveReceipt)
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "prove-transaction-reverted" if the prove transaction reverts', async function () {
    const proveReceipt = { status: 'reverted' }

    const l1WalletClient = createL1WalletClient({
      waitForTransactionReceipt: vi.fn().mockResolvedValue(proveReceipt),
    })
    vi.mocked(getWithdrawalStatus).mockResolvedValue('ready-to-prove')

    const { emitter, promise } = proveWithdrawal({
      ...validParameters,
      l1WalletClient,
    })

    const onPreProve = vi.fn()
    const onProveReverted = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-prove', onPreProve)
    emitter.on('prove-transaction-reverted', onProveReverted)
    emitter.on('prove-settled', onSettled)

    await promise

    expect(onPreProve).toHaveBeenCalledOnce()
    expect(onProveReverted).toHaveBeenCalledExactlyOnceWith(proveReceipt)
    expect(onSettled).toHaveBeenCalledOnce()
  })
})
