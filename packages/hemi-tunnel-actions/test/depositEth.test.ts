import { hemiSepolia } from 'hemi-viem'
import { type PublicClient, WalletClient, zeroAddress, zeroHash } from 'viem'
import { writeContract } from 'viem/actions'
import { sepolia } from 'viem/chains'
import { beforeEach, describe, it, expect, vi } from 'vitest'

import { depositEth } from '../src/depositEth'

vi.mock('viem/actions', () => ({
  writeContract: vi.fn(),
}))

describe('depositEth', function () {
  const depositBuilt = {
    account: zeroAddress,
    request: { gas: BigInt(21_000), value: BigInt(1) },
  }

  beforeEach(function () {
    vi.clearAllMocks()
  })

  it('should emit "deposit-failed-validation" if the account is not a valid address', async function () {
    // @ts-expect-error adding the min data needed
    const l1PublicClient: PublicClient = {}

    const { emitter, promise } = depositEth({
      account: 'invalid-address',
      amount: BigInt(100),
      l1Chain: sepolia,
      l1PublicClient,
      l2Chain: hemiSepolia,
    })

    const failedValidation = vi.fn()
    emitter.on('deposit-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'account is not a valid address',
    )
  })

  it('should emit "deposit-failed-validation" if the amount is not a bigint', async function () {
    // @ts-expect-error adding the min data needed
    const l1PublicClient: PublicClient = {}

    const { emitter, promise } = depositEth({
      account: zeroAddress,
      amount: '100',
      l1Chain: sepolia,
      l1PublicClient,
      l2Chain: hemiSepolia,
    })

    const failedValidation = vi.fn()
    emitter.on('deposit-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'amount is not a bigint',
    )
  })

  it('should emit "deposit-failed-validation" if the amount is less than or equal to 0', async function () {
    // @ts-expect-error adding the min data needed
    const l1PublicClient: PublicClient = {}

    const { emitter, promise } = depositEth({
      account: zeroAddress,
      amount: BigInt(0),
      l1Chain: sepolia,
      l1PublicClient,
      l2Chain: hemiSepolia,
    })

    const failedValidation = vi.fn()
    emitter.on('deposit-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'amount is not greater than 0',
    )
  })

  it('should emit "deposit-failed-validation" if the L1 and L2 chains are the same', async function () {
    // @ts-expect-error adding the min data needed
    const l1PublicClient: PublicClient = {}

    const { emitter, promise } = depositEth({
      account: zeroAddress,
      amount: BigInt(100),
      l1Chain: sepolia,
      l1PublicClient,
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
    // @ts-expect-error adding the min data needed
    const l1PublicClient: PublicClient = {
      getBalance: vi.fn().mockResolvedValue(BigInt(50)),
    }

    const { emitter, promise } = depositEth({
      account: zeroAddress,
      amount: BigInt(100),
      l1Chain: sepolia,
      l1PublicClient,
      l2Chain: hemiSepolia,
    })

    const failedValidation = vi.fn()
    emitter.on('deposit-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'insufficient balance',
    )
  })

  it('should emit "deposit-failed-validation" if the deposited amount is the same as the account balance', async function () {
    const amount = BigInt(100)
    // @ts-expect-error adding the min data needed
    const l1PublicClient: PublicClient = {
      getBalance: vi.fn().mockResolvedValue(amount),
    }

    const { emitter, promise } = depositEth({
      account: zeroAddress,
      amount,
      l1Chain: sepolia,
      l1PublicClient,
      l2Chain: hemiSepolia,
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

    // @ts-expect-error adding the min data needed
    const l1WalletClient: WalletClient = {}

    // @ts-expect-error adding the min data needed
    const l1PublicClient: PublicClient = {
      getBalance: vi
        .fn()
        .mockResolvedValue(depositBuilt.request.value + BigInt(1000)),
      waitForTransactionReceipt: vi.fn().mockResolvedValue(receipt),
    }

    vi.mocked(writeContract).mockResolvedValue(zeroHash)

    const { emitter, promise } = depositEth({
      account: zeroAddress,
      amount: depositBuilt.request.value,
      l1Chain: sepolia,
      l1PublicClient,
      l1WalletClient,
      l2Chain: hemiSepolia,
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
      l1WalletClient,
      expect.objectContaining({
        account: zeroAddress,
        args: [expect.any(Number), '0x'],
        value: depositBuilt.request.value,
      }),
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "user-signing-error" when signing fails', async function () {
    // @ts-expect-error adding the min data needed
    const l1WalletClient: WalletClient = {}

    // @ts-expect-error adding the min data needed
    const l1PublicClient: PublicClient = {
      getBalance: vi
        .fn()
        .mockResolvedValue(depositBuilt.request.value + BigInt(1000)),
      waitForTransactionReceipt: vi.fn(),
    }

    vi.mocked(writeContract).mockRejectedValue(new Error('Signing error'))

    const { emitter, promise } = depositEth({
      account: zeroAddress,
      amount: depositBuilt.request.value,
      l1Chain: sepolia,
      l1PublicClient,
      l1WalletClient,
      l2Chain: hemiSepolia,
    })

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
    // @ts-expect-error adding the min data needed
    const l1WalletClient: WalletClient = {}

    // @ts-expect-error adding the min data needed
    const l1PublicClient: PublicClient = {
      getBalance: vi
        .fn()
        .mockResolvedValue(depositBuilt.request.value + BigInt(1000)),
      waitForTransactionReceipt: vi
        .fn()
        .mockRejectedValue(new Error('Transaction receipt error')),
    }

    vi.mocked(writeContract).mockResolvedValue(zeroHash)

    const { emitter, promise } = depositEth({
      account: zeroAddress,
      amount: depositBuilt.request.value,
      l1Chain: sepolia,
      l1PublicClient,
      l1WalletClient,
      l2Chain: hemiSepolia,
    })

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

    // @ts-expect-error adding the min data needed
    const l1WalletClient: WalletClient = {}

    // @ts-expect-error adding the min data needed
    const l1PublicClient: PublicClient = {
      getBalance: vi
        .fn()
        .mockResolvedValue(depositBuilt.request.value + BigInt(1000)),
      waitForTransactionReceipt: vi.fn().mockResolvedValue(receipt),
    }

    vi.mocked(writeContract).mockResolvedValue(zeroHash)

    const { emitter, promise } = depositEth({
      account: zeroAddress,
      amount: depositBuilt.request.value,
      l1Chain: sepolia,
      l1PublicClient,
      l1WalletClient,
      l2Chain: hemiSepolia,
    })

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
