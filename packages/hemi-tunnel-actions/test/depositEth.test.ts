import { hemiSepolia } from 'hemi-viem'
import { type PublicClient, WalletClient, zeroAddress, zeroHash } from 'viem'
import {
  getBalance,
  waitForTransactionReceipt,
  writeContract,
} from 'viem/actions'
import { sepolia } from 'viem/chains'
import { describe, it, expect, vi } from 'vitest'

import { depositEth } from '../src/depositEth'

vi.mock('viem/actions', () => ({
  getBalance: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}))

const validParameters = {
  account: zeroAddress,
  amount: BigInt(100),
  l1Chain: sepolia,
  l1PublicClient: {} as PublicClient,
  l1WalletClient: {} as WalletClient,
  l2Chain: hemiSepolia,
}

describe('depositEth', function () {
  it('should emit "deposit-failed-validation" if the account is not a valid address', async function () {
    const { emitter, promise } = depositEth({
      ...validParameters,
      account: 'invalid-address',
    })

    const failedValidation = vi.fn()
    emitter.on('deposit-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'account is not a valid address',
    )
  })

  it('should emit "deposit-failed-validation" if the amount is not a bigint', async function () {
    const { emitter, promise } = depositEth({
      ...validParameters,
      amount: '100',
    })

    const failedValidation = vi.fn()
    emitter.on('deposit-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'amount is not a bigint',
    )
  })

  it('should emit "deposit-failed-validation" if the amount is less than or equal to 0', async function () {
    const { emitter, promise } = depositEth({
      ...validParameters,
      amount: BigInt(0),
    })

    const failedValidation = vi.fn()
    emitter.on('deposit-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'amount is not greater than 0',
    )
  })

  it('should emit "deposit-failed-validation" if the L1 and L2 chains are the same', async function () {
    const { emitter, promise } = depositEth({
      ...validParameters,
      l2Chain: sepolia,
    })

    const failedValidation = vi.fn()
    emitter.on('deposit-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'l1 and l2 chains are the same',
    )
  })

  it('should emit "deposit-failed-validation" if the account balance is insufficient', async function () {
    vi.mocked(getBalance).mockResolvedValue(BigInt(50))

    const { emitter, promise } = depositEth(validParameters)

    const failedValidation = vi.fn()
    emitter.on('deposit-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'insufficient balance',
    )
  })

  it('should emit "deposit-failed-validation" if the deposited amount is the same as the account balance', async function () {
    const amount = BigInt(100)
    vi.mocked(getBalance).mockResolvedValue(amount)

    const { emitter, promise } = depositEth({
      ...validParameters,
      amount,
    })

    const failedValidation = vi.fn()
    emitter.on('deposit-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'insufficient balance',
    )
  })

  it('should emit "deposit-transaction-succeeded" when deposit succeeds', async function () {
    const receipt = { status: 'success' }
    const amount = BigInt(1)

    vi.mocked(getBalance).mockResolvedValue(BigInt(1000))
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = depositEth({
      ...validParameters,
      amount,
    })

    const onDeposit = vi.fn()
    const userSignedTransaction = vi.fn()
    const depositTransactionSucceeded = vi.fn()
    const onDepositTransactionReverted = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-deposit', onDeposit)
    emitter.on('user-signed-deposit', userSignedTransaction)
    emitter.on('deposit-transaction-succeeded', depositTransactionSucceeded)
    emitter.on('deposit-transaction-reverted', onDepositTransactionReverted)
    emitter.on('deposit-settled', onSettled)

    await promise

    expect(onDeposit).toHaveBeenCalled()
    expect(userSignedTransaction).toHaveBeenCalledWith(zeroHash)
    expect(depositTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(receipt)
    expect(onDepositTransactionReverted).not.toHaveBeenCalled()
    expect(writeContract).toHaveBeenCalledExactlyOnceWith(
      validParameters.l1WalletClient,
      expect.objectContaining({
        account: zeroAddress,
        args: [expect.any(Number), '0x'],
        value: amount,
      }),
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "user-signing-error" when signing fails', async function () {
    vi.mocked(getBalance).mockResolvedValue(BigInt(1000))
    vi.mocked(writeContract).mockRejectedValue(new Error('Signing error'))

    const { emitter, promise } = depositEth(validParameters)

    const onDepositCallback = vi.fn()
    const onSigningError = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-deposit', onDepositCallback)
    emitter.on('user-signing-deposit-error', onSigningError)
    emitter.on('deposit-settled', onSettled)

    await promise

    expect(onDepositCallback).toHaveBeenCalledOnce()
    expect(onSigningError).toHaveBeenCalledExactlyOnceWith(expect.any(Error))
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "deposit-failed" when transaction receipt fails', async function () {
    vi.mocked(getBalance).mockResolvedValue(BigInt(1000))
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(
      new Error('Transaction receipt error'),
    )

    const { emitter, promise } = depositEth(validParameters)

    const onDeposit = vi.fn()
    const onUserSignedTransaction = vi.fn()
    const onDepositFailed = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-deposit', onDeposit)
    emitter.on('user-signed-deposit', onUserSignedTransaction)
    emitter.on('deposit-failed', onDepositFailed)
    emitter.on('deposit-settled', onSettled)

    await promise

    expect(onDeposit).toHaveBeenCalledOnce()
    expect(onUserSignedTransaction).toHaveBeenCalledExactlyOnceWith(zeroHash)
    expect(onDepositFailed).toHaveBeenCalledExactlyOnceWith(expect.any(Error))
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "deposit-transaction-reverted" when transaction reverts', async function () {
    const receipt = { status: 'reverted' }

    vi.mocked(getBalance).mockResolvedValue(BigInt(1000))
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = depositEth(validParameters)

    const onDeposit = vi.fn()
    const onUserSignedTransaction = vi.fn()
    const depositTransactionSucceeded = vi.fn()
    const onDepositTransactionReverted = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-deposit', onDeposit)
    emitter.on('user-signed-deposit', onUserSignedTransaction)
    emitter.on('deposit-transaction-succeeded', depositTransactionSucceeded)
    emitter.on('deposit-transaction-reverted', onDepositTransactionReverted)
    emitter.on('deposit-settled', onSettled)

    await promise

    expect(onDeposit).toHaveBeenCalledOnce()
    expect(onUserSignedTransaction).toHaveBeenCalledExactlyOnceWith(zeroHash)
    expect(depositTransactionSucceeded).not.toHaveBeenCalled()
    expect(onDepositTransactionReverted).toHaveBeenCalledExactlyOnceWith(
      receipt,
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })
})
