import { hemiSepolia } from 'hemi-viem'
import { type PublicClient, WalletClient, zeroAddress, zeroHash } from 'viem'
import { writeContract } from 'viem/actions'
import { sepolia } from 'viem/chains'
import { describe, it, expect, vi } from 'vitest'

import {
  initiateWithdrawErc20,
  initiateWithdrawEth,
} from '../src/initiateWithdraw'

vi.mock('viem/actions', () => ({
  writeContract: vi.fn(),
}))

const createL2PublicClient = ({
  getBalance = vi.fn().mockResolvedValue(BigInt(1000)),
  getErc20TokenBalance = vi.fn().mockResolvedValue(BigInt(1000)),
  waitForTransactionReceipt = vi.fn().mockResolvedValue({ status: 'success' }),
} = {}): PublicClient =>
  ({
    extend: vi.fn().mockReturnValue({
      getErc20TokenBalance,
    }),
    getBalance,
    waitForTransactionReceipt,
  }) as PublicClient

const validParameters = {
  account: zeroAddress,
  amount: BigInt(100),
  l1Chain: sepolia,
  l2Chain: hemiSepolia,
  l2PublicClient: createL2PublicClient(),
  l2TokenAddress: zeroAddress,
  l2WalletClient: {} as WalletClient,
}

const runCommonTests = function (
  // Both functions have the same signature
  initiateWithdraw: typeof initiateWithdrawErc20,
) {
  it('should emit "withdraw-failed-validation" if the account is not a valid address', async function () {
    const { emitter, promise } = initiateWithdraw({
      ...validParameters,
      account: 'invalid-address',
    })

    const failedValidation = vi.fn()
    const onSettled = vi.fn()
    emitter.on('withdraw-failed-validation', failedValidation)
    emitter.on('withdraw-settled', onSettled)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'account is not a valid address',
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "withdraw-failed-validation" if the amount is not a bigint', async function () {
    const { emitter, promise } = initiateWithdraw({
      ...validParameters,
      amount: '100',
    })

    const failedValidation = vi.fn()
    const onSettled = vi.fn()

    emitter.on('withdraw-failed-validation', failedValidation)
    emitter.on('withdraw-settled', onSettled)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'amount is not a bigint',
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "withdraw-failed-validation" if the amount equals 0', async function () {
    const { emitter, promise } = initiateWithdraw({
      ...validParameters,
      amount: BigInt(0),
    })

    const failedValidation = vi.fn()
    const onSettled = vi.fn()

    emitter.on('withdraw-failed-validation', failedValidation)
    emitter.on('withdraw-settled', onSettled)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'amount is not greater than 0',
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "withdraw-failed-validation" if the amount is less than 0', async function () {
    const { emitter, promise } = initiateWithdraw({
      ...validParameters,
      amount: BigInt(-1),
    })

    const failedValidation = vi.fn()
    const onSettled = vi.fn()

    emitter.on('withdraw-failed-validation', failedValidation)
    emitter.on('withdraw-settled', onSettled)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'amount is not greater than 0',
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "withdraw-transaction-succeeded" when withdraw succeeds', async function () {
    const receipt = { status: 'success' }
    const amount = BigInt(1)

    const l2PublicClient = createL2PublicClient({
      getErc20TokenBalance: vi.fn().mockResolvedValue(BigInt(1000)),
      waitForTransactionReceipt: vi.fn().mockResolvedValue(receipt),
    })

    vi.mocked(writeContract).mockResolvedValue(zeroHash)

    const { emitter, promise } = initiateWithdraw({
      ...validParameters,
      amount,
      l2PublicClient,
    })

    const onWithdraw = vi.fn()
    const userSignedTransaction = vi.fn()
    const withdrawTransactionSucceeded = vi.fn()
    const onWithdrawTransactionReverted = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-withdraw', onWithdraw)
    emitter.on('user-signed-withdraw', userSignedTransaction)
    emitter.on('withdraw-transaction-succeeded', withdrawTransactionSucceeded)
    emitter.on('withdraw-transaction-reverted', onWithdrawTransactionReverted)
    emitter.on('withdraw-settled', onSettled)

    await promise

    expect(onWithdraw).toHaveBeenCalled()
    expect(userSignedTransaction).toHaveBeenCalledWith(zeroHash)
    expect(withdrawTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(
      receipt,
    )
    expect(onWithdrawTransactionReverted).not.toHaveBeenCalled()
    expect(writeContract).toHaveBeenCalledExactlyOnceWith(
      validParameters.l2WalletClient,
      expect.objectContaining({
        account: zeroAddress,
        args: [validParameters.l2TokenAddress, amount, 0, '0x'],
      }),
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "user-signing-withdraw-error" when signing fails', async function () {
    const amount = BigInt(1)

    const l2PublicClient = createL2PublicClient({
      getErc20TokenBalance: vi.fn().mockResolvedValue(BigInt(1000)),
      waitForTransactionReceipt: vi.fn(),
    })

    vi.mocked(writeContract).mockRejectedValue(new Error('Signing error'))

    const { emitter, promise } = initiateWithdraw({
      ...validParameters,
      amount,
      l2PublicClient,
    })

    const onWithdrawCallback = vi.fn()
    const onSigningError = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-withdraw', onWithdrawCallback)
    emitter.on('user-signing-withdraw-error', onSigningError)
    emitter.on('withdraw-settled', onSettled)

    await promise

    expect(onWithdrawCallback).toHaveBeenCalledOnce()
    expect(onSigningError).toHaveBeenCalledExactlyOnceWith(expect.any(Error))
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "withdraw-failed" when transaction receipt fails', async function () {
    const amount = BigInt(1)

    const l2PublicClient = createL2PublicClient({
      getErc20TokenBalance: vi.fn().mockResolvedValue(BigInt(1000)),
      waitForTransactionReceipt: vi
        .fn()
        .mockRejectedValue(new Error('Transaction receipt error')),
    })

    vi.mocked(writeContract).mockResolvedValue(zeroHash)

    const { emitter, promise } = initiateWithdraw({
      ...validParameters,
      amount,
      l2PublicClient,
    })

    const onWithdraw = vi.fn()
    const onUserSignedTransaction = vi.fn()
    const onWithdrawFailed = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-withdraw', onWithdraw)
    emitter.on('user-signed-withdraw', onUserSignedTransaction)
    emitter.on('withdraw-failed', onWithdrawFailed)
    emitter.on('withdraw-settled', onSettled)

    await promise

    expect(onWithdraw).toHaveBeenCalledOnce()
    expect(onUserSignedTransaction).toHaveBeenCalledExactlyOnceWith(zeroHash)
    expect(onWithdrawFailed).toHaveBeenCalledExactlyOnceWith(expect.any(Error))
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "withdraw-transaction-reverted" when transaction reverts', async function () {
    const receipt = { status: 'reverted' }
    const amount = BigInt(1)

    const l2PublicClient = createL2PublicClient({
      getErc20TokenBalance: vi.fn().mockResolvedValue(BigInt(1000)),
      waitForTransactionReceipt: vi.fn().mockResolvedValue(receipt),
    })

    vi.mocked(writeContract).mockResolvedValue(zeroHash)

    const { emitter, promise } = initiateWithdraw({
      ...validParameters,
      amount,
      l2PublicClient,
    })

    const onWithdraw = vi.fn()
    const onUserSignedTransaction = vi.fn()
    const withdrawTransactionSucceeded = vi.fn()
    const onWithdrawTransactionReverted = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-withdraw', onWithdraw)
    emitter.on('user-signed-withdraw', onUserSignedTransaction)
    emitter.on('withdraw-transaction-succeeded', withdrawTransactionSucceeded)
    emitter.on('withdraw-transaction-reverted', onWithdrawTransactionReverted)
    emitter.on('withdraw-settled', onSettled)

    await promise

    expect(onWithdraw).toHaveBeenCalledOnce()
    expect(onUserSignedTransaction).toHaveBeenCalledExactlyOnceWith(zeroHash)
    expect(withdrawTransactionSucceeded).not.toHaveBeenCalled()
    expect(onWithdrawTransactionReverted).toHaveBeenCalledExactlyOnceWith(
      receipt,
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })
}

describe('withdraw', function () {
  describe('initiateWithdrawEth', function () {
    // eslint-disable-next-line @vitest/require-hook
    runCommonTests(initiateWithdrawEth)

    it('should emit "withdraw-failed-validation" if the account balance is insufficient', async function () {
      const l2PublicClient = createL2PublicClient({
        getBalance: vi.fn().mockResolvedValue(BigInt(50)),
      })

      const { emitter, promise } = initiateWithdrawEth({
        ...validParameters,
        l2PublicClient,
      })

      const failedValidation = vi.fn()
      const onSettled = vi.fn()

      emitter.on('withdraw-failed-validation', failedValidation)
      emitter.on('withdraw-settled', onSettled)

      await promise

      expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
        'insufficient balance',
      )
      expect(onSettled).toHaveBeenCalledOnce()
    })

    it('should emit "withdraw-failed-validation" if the account balance is the same as the withdrawn amount', async function () {
      const l2PublicClient = createL2PublicClient({
        getBalance: vi.fn().mockResolvedValue(BigInt(validParameters.amount)),
      })

      const { emitter, promise } = initiateWithdrawEth({
        ...validParameters,
        l2PublicClient,
      })

      const failedValidation = vi.fn()
      const onSettled = vi.fn()

      emitter.on('withdraw-failed-validation', failedValidation)
      emitter.on('withdraw-settled', onSettled)

      await promise

      expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
        'insufficient balance',
      )
      expect(onSettled).toHaveBeenCalledOnce()
    })
  })

  describe('initiateWithdrawErc20', function () {
    // eslint-disable-next-line @vitest/require-hook
    runCommonTests(initiateWithdrawErc20)

    it('should emit "withdraw-failed-validation" if the account balance is insufficient', async function () {
      const l2PublicClient = createL2PublicClient({
        getErc20TokenBalance: vi.fn().mockResolvedValue(BigInt(50)),
      })

      const { emitter, promise } = initiateWithdrawErc20({
        ...validParameters,
        l2PublicClient,
      })

      const failedValidation = vi.fn()
      const onSettled = vi.fn()

      emitter.on('withdraw-failed-validation', failedValidation)
      emitter.on('withdraw-settled', onSettled)

      await promise

      expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
        'insufficient balance',
      )
      expect(onSettled).toHaveBeenCalledOnce()
    })

    it('should emit "withdraw-failed-validation" if the account ETH balance is zero', async function () {
      const l2PublicClient = createL2PublicClient({
        getBalance: vi.fn().mockResolvedValue(BigInt(0)),
        getErc20TokenBalance: vi.fn().mockResolvedValue(BigInt(100)),
      })

      const { emitter, promise } = initiateWithdrawErc20({
        ...validParameters,
        l2PublicClient,
      })

      const failedValidation = vi.fn()
      const onSettled = vi.fn()

      emitter.on('withdraw-failed-validation', failedValidation)
      emitter.on('withdraw-settled', onSettled)

      await promise

      expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
        'insufficient balance to pay for gas',
      )
      expect(onSettled).toHaveBeenCalledOnce()
    })
  })
})
