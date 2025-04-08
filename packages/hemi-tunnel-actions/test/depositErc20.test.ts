import { hemiSepolia } from 'hemi-viem'
import { zeroAddress, zeroHash } from 'viem'
import { writeContract } from 'viem/actions'
import { sepolia } from 'viem/chains'
import { beforeEach, describe, it, expect, vi } from 'vitest'

import { depositErc20 } from '../src/depositErc20'

vi.mock('viem/actions', () => ({
  writeContract: vi.fn(),
}))

describe('depositErc20', function () {
  const getErc20TokenAllowance = vi.fn()
  const getErc20TokenBalance = vi.fn()
  const waitForTransactionReceipt = vi.fn()

  const getL1PublicClientMock = () => ({
    extend: () => ({
      getErc20TokenAllowance,
      getErc20TokenBalance,
      waitForTransactionReceipt,
    }),
  })

  const approveErc20Token = vi.fn()
  const getL1WalletClientMock = () => ({
    extend: () => ({
      approveErc20Token,
    }),
  })

  beforeEach(function () {
    vi.clearAllMocks()
  })

  it('should emit "deposit-failed-validation" if the account is not a valid address', async function () {
    const l1PublicClient = getL1PublicClientMock()
    const l1WalletClient = getL1WalletClientMock()

    const { emitter, promise } = depositErc20({
      account: 'invalid-address',
      amount: BigInt(100),
      l1Chain: sepolia,
      l1PublicClient,
      l1TokenAddress: zeroAddress,
      l1WalletClient,
      l2Chain: hemiSepolia,
      l2TokenAddress: zeroAddress,
    })

    const depositFailedValidation = vi.fn()
    emitter.on('deposit-failed-validation', depositFailedValidation)

    await promise

    expect(depositFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'account is not a valid address',
    )
  })

  it('should emit "deposit-failed-validation" if the amount is not a bigint', async function () {
    const l1PublicClient = getL1PublicClientMock()
    const l1WalletClient = getL1WalletClientMock()

    const { emitter, promise } = depositErc20({
      account: zeroAddress,
      amount: 'not-a-bigint',
      l1Chain: sepolia,
      l1PublicClient,
      l1TokenAddress: zeroAddress,
      l1WalletClient,
      l2Chain: hemiSepolia,
      l2TokenAddress: zeroAddress,
    })

    const depositFailedValidation = vi.fn()
    emitter.on('deposit-failed-validation', depositFailedValidation)

    await promise

    expect(depositFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'amount is not a bigint',
    )
  })

  it('should emit "deposit-failed-validation" if the amount is less than or equal to 0', async function () {
    const l1PublicClient = getL1PublicClientMock()
    const l1WalletClient = getL1WalletClientMock()

    const { emitter, promise } = depositErc20({
      account: zeroAddress,
      amount: BigInt(0),
      l1Chain: sepolia,
      l1PublicClient,
      l1TokenAddress: zeroAddress,
      l1WalletClient,
      l2Chain: hemiSepolia,
      l2TokenAddress: zeroAddress,
    })

    const depositFailedValidation = vi.fn()
    emitter.on('deposit-failed-validation', depositFailedValidation)

    await promise

    expect(depositFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'amount is not greater than 0',
    )
  })

  it('should emit "deposit-failed-validation" if the L1 and L2 chains are the same', async function () {
    const l1PublicClient = getL1PublicClientMock()
    const l1WalletClient = getL1WalletClientMock()

    const { emitter, promise } = depositErc20({
      account: zeroAddress,
      amount: BigInt(100),
      l1Chain: sepolia,
      l1PublicClient,
      l1TokenAddress: zeroAddress,
      l1WalletClient,
      l2Chain: sepolia,
      l2TokenAddress: zeroAddress,
    })

    const depositFailedValidation = vi.fn()
    emitter.on('deposit-failed-validation', depositFailedValidation)

    await promise

    expect(depositFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'l1 and l2 chains are the same',
    )
  })

  it('should emit "deposit-failed-validation" if the token does not have enough balance', async function () {
    const l1PublicClient = getL1PublicClientMock()
    const l1WalletClient = getL1WalletClientMock()

    vi.mocked(getErc20TokenBalance).mockResolvedValue(BigInt(50))

    const { emitter, promise } = depositErc20({
      account: zeroAddress,
      amount: BigInt(100),
      l1Chain: sepolia,
      l1PublicClient,
      l1TokenAddress: zeroAddress,
      l1WalletClient,
      l2Chain: hemiSepolia,
      l2TokenAddress: zeroAddress,
    })

    const depositFailedValidation = vi.fn()
    emitter.on('deposit-failed-validation', depositFailedValidation)

    await promise

    expect(depositFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'insufficient balance',
    )
  })

  it('should emit "approve-transaction-succeeded" and "deposit-transaction-succeeded" when approval and deposit succeeds', async function () {
    const l1PublicClient = getL1PublicClientMock()
    const l1WalletClient = getL1WalletClientMock()

    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(getErc20TokenAllowance).mockResolvedValue(BigInt(0))
    vi.mocked(getErc20TokenBalance).mockResolvedValue(BigInt(200))
    vi.mocked(approveErc20Token).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'success',
    })

    const { emitter, promise } = depositErc20({
      account: zeroAddress,
      amount: BigInt(100),
      l1Chain: sepolia,
      l1PublicClient,
      l1TokenAddress: zeroAddress,
      l1WalletClient,
      l2Chain: hemiSepolia,
      l2TokenAddress: zeroAddress,
    })

    const onApprove = vi.fn()
    const approveTransactionSucceeded = vi.fn()
    const depositTransactionSucceeded = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-approve', onApprove)
    emitter.on('approve-transaction-succeeded', approveTransactionSucceeded)
    emitter.on('deposit-transaction-succeeded', depositTransactionSucceeded)
    emitter.on('deposit-settled', onSettled)

    await promise

    expect(onApprove).toHaveBeenCalledOnce()
    expect(approveTransactionSucceeded).toHaveBeenCalledOnce()
    expect(depositTransactionSucceeded).toHaveBeenCalledOnce()
    expect(writeContract).toHaveBeenCalled()
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should support approving a custom amount', async function () {
    const l1PublicClient = getL1PublicClientMock()
    const l1WalletClient = getL1WalletClientMock()

    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(getErc20TokenAllowance).mockResolvedValue(BigInt(0))
    vi.mocked(getErc20TokenBalance).mockResolvedValue(BigInt(200))
    vi.mocked(approveErc20Token).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'success',
    })

    const approvalAmount = BigInt(1000)

    const { emitter, promise } = depositErc20({
      account: zeroAddress,
      amount: BigInt(100),
      approvalAmount,
      l1Chain: sepolia,
      l1PublicClient,
      l1TokenAddress: zeroAddress,
      l1WalletClient,
      l2Chain: hemiSepolia,
      l2TokenAddress: zeroAddress,
    })

    const onApprove = vi.fn()
    const approveTransactionSucceeded = vi.fn()
    const depositTransactionSucceeded = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-approve', onApprove)
    emitter.on('approve-transaction-succeeded', approveTransactionSucceeded)
    emitter.on('deposit-transaction-succeeded', depositTransactionSucceeded)
    emitter.on('deposit-settled', onSettled)

    await promise

    expect(approveErc20Token).toHaveBeenCalledExactlyOnceWith({
      address: zeroAddress,
      amount: approvalAmount,
      spender: hemiSepolia.contracts.l1StandardBridge[sepolia.id].address,
    })
    expect(onApprove).toHaveBeenCalledOnce()
    expect(approveTransactionSucceeded).toHaveBeenCalledOnce()
    expect(depositTransactionSucceeded).toHaveBeenCalledOnce()
    expect(writeContract).toHaveBeenCalled()
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "user-signing-approve-error" when approval fails', async function () {
    const l1PublicClient = getL1PublicClientMock()
    const l1WalletClient = getL1WalletClientMock()

    vi.mocked(getErc20TokenAllowance).mockResolvedValue(BigInt(0))
    vi.mocked(getErc20TokenBalance).mockResolvedValue(BigInt(200))
    vi.mocked(approveErc20Token).mockRejectedValue(new Error('Approval error'))

    const { emitter, promise } = depositErc20({
      account: zeroAddress,
      amount: BigInt(100),
      l1Chain: sepolia,
      l1PublicClient,
      l1TokenAddress: zeroAddress,
      l1WalletClient,
      l2Chain: hemiSepolia,
      l2TokenAddress: zeroAddress,
    })

    const onApprove = vi.fn()
    const userSigningApproveError = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-approve', onApprove)
    emitter.on('user-signing-approve-error', userSigningApproveError)
    emitter.on('deposit-settled', onSettled)

    await promise

    expect(onApprove).toHaveBeenCalledOnce()
    expect(userSigningApproveError).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "approve-transaction-reverted" when approval transaction reverts', async function () {
    const l1PublicClient = getL1PublicClientMock()
    const l1WalletClient = getL1WalletClientMock()

    vi.mocked(getErc20TokenAllowance).mockResolvedValue(BigInt(0))
    vi.mocked(getErc20TokenBalance).mockResolvedValue(BigInt(200))
    vi.mocked(approveErc20Token).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'reverted',
    })

    const { emitter, promise } = depositErc20({
      account: zeroAddress,
      amount: BigInt(100),
      l1Chain: sepolia,
      l1PublicClient,
      l1TokenAddress: zeroAddress,
      l1WalletClient,
      l2Chain: hemiSepolia,
      l2TokenAddress: zeroAddress,
    })

    const onApprove = vi.fn()
    const approveTransactionReverted = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-approve', onApprove)
    emitter.on('approve-transaction-reverted', approveTransactionReverted)
    emitter.on('deposit-settled', onSettled)

    await promise

    expect(onApprove).toHaveBeenCalledOnce()
    expect(approveTransactionReverted).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ status: 'reverted' }),
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "user-signing-deposit-error" when deposit signing fails', async function () {
    const l1PublicClient = getL1PublicClientMock()
    const l1WalletClient = getL1WalletClientMock()

    vi.mocked(getErc20TokenAllowance).mockResolvedValue(BigInt(200))
    vi.mocked(getErc20TokenBalance).mockResolvedValue(BigInt(200))
    vi.mocked(writeContract).mockRejectedValue(new Error('Signing error'))

    const { emitter, promise } = depositErc20({
      account: zeroAddress,
      amount: BigInt(100),
      l1Chain: sepolia,
      l1PublicClient,
      l1TokenAddress: zeroAddress,
      l1WalletClient,
      l2Chain: hemiSepolia,
      l2TokenAddress: zeroAddress,
    })

    const onDeposit = vi.fn()
    const userSigningDepositError = vi.fn()
    const onSettled = vi.fn()
    emitter.on('pre-deposit', onDeposit)
    emitter.on('user-signing-deposit-error', userSigningDepositError)
    emitter.on('deposit-settled', onSettled)

    await promise

    expect(onDeposit).toHaveBeenCalledOnce()
    expect(userSigningDepositError).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "deposit-transaction-reverted" when deposit transaction reverts', async function () {
    const l1PublicClient = getL1PublicClientMock()
    const l1WalletClient = getL1WalletClientMock()

    vi.mocked(getErc20TokenAllowance).mockResolvedValue(BigInt(200))
    vi.mocked(getErc20TokenBalance).mockResolvedValue(BigInt(200))
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'reverted',
    })

    const { emitter, promise } = depositErc20({
      account: zeroAddress,
      amount: BigInt(100),
      l1Chain: sepolia,
      l1PublicClient,
      l1TokenAddress: zeroAddress,
      l1WalletClient,
      l2Chain: hemiSepolia,
      l2TokenAddress: zeroAddress,
    })

    const onDeposit = vi.fn()
    const depositTransactionReverted = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-deposit', onDeposit)
    emitter.on('deposit-transaction-reverted', depositTransactionReverted)
    emitter.on('deposit-settled', onSettled)

    await promise

    expect(onDeposit).toHaveBeenCalledOnce()
    expect(depositTransactionReverted).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ status: 'reverted' }),
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })
})
