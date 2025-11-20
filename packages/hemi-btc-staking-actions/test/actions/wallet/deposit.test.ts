import { hemiSepolia } from 'hemi-viem'
import {
  type TransactionReceipt,
  type WalletClient,
  zeroAddress,
  zeroHash,
} from 'viem'
import { waitForTransactionReceipt } from 'viem/actions'
import { balanceOf } from 'viem-erc20/actions'
import {
  allowance,
  approve,
  asset,
  deposit as vaultDeposit,
  maxDeposit,
} from 'viem-erc4626/actions'
import { describe, expect, it, vi } from 'vitest'

import { getMinimumDepositLimit } from '../../../src/actions/public/minimumDepositLimit'
import { depositToken } from '../../../src/actions/wallet/deposit'

vi.mock('../../../src/actions/public/minimumDepositLimit', () => ({
  getMinimumDepositLimit: vi.fn(),
}))

vi.mock('viem/actions', () => ({
  waitForTransactionReceipt: vi.fn(),
}))

vi.mock('viem-erc20/actions', () => ({
  balanceOf: vi.fn(),
}))

vi.mock('viem-erc4626/actions', () => ({
  allowance: vi.fn(),
  approve: vi.fn(),
  asset: vi.fn(),
  balanceOf: vi.fn(),
  deposit: vi.fn(),
  maxDeposit: vi.fn(),
}))

const mockWalletClient = {
  chain: hemiSepolia,
} as unknown as WalletClient

const validParameters = {
  account: zeroAddress,
  amount: BigInt(100),
  receiver: zeroAddress,
  walletClient: mockWalletClient,
}

describe('depositToken', function () {
  it('should emit "unexpected-error" if wallet client chain is not defined', async function () {
    const walletClientWithoutChain = {} as WalletClient

    const { emitter, promise } = depositToken({
      ...validParameters,
      walletClient: walletClientWithoutChain,
    })

    const onUnexpectedError = vi.fn()
    const onSettled = vi.fn()
    emitter.on('unexpected-error', onUnexpectedError)
    emitter.on('deposit-settled', onSettled)

    await promise

    expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(expect.any(Error))
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "deposit-failed-validation" if amount is zero', async function () {
    vi.mocked(asset).mockResolvedValue(zeroAddress)
    vi.mocked(getMinimumDepositLimit).mockResolvedValue(BigInt(1))

    const { emitter, promise } = depositToken({
      ...validParameters,
      amount: BigInt(0),
    })

    const depositFailedValidation = vi.fn()
    emitter.on('deposit-failed-validation', depositFailedValidation)

    await promise

    expect(depositFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'invalid amount',
    )
  })

  it('should emit "deposit-failed-validation" if amount is negative', async function () {
    vi.mocked(asset).mockResolvedValue(zeroAddress)
    vi.mocked(getMinimumDepositLimit).mockResolvedValue(BigInt(1))

    const { emitter, promise } = depositToken({
      ...validParameters,
      amount: BigInt(-1),
    })

    const depositFailedValidation = vi.fn()
    emitter.on('deposit-failed-validation', depositFailedValidation)

    await promise

    expect(depositFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'invalid amount',
    )
  })

  it('should emit "deposit-failed-validation" if amount is undefined', async function () {
    vi.mocked(asset).mockResolvedValue(zeroAddress)
    vi.mocked(getMinimumDepositLimit).mockResolvedValue(BigInt(1))

    const { emitter, promise } = depositToken({
      ...validParameters,
      // @ts-expect-error testing invalid input
      amount: undefined,
    })

    const depositFailedValidation = vi.fn()
    emitter.on('deposit-failed-validation', depositFailedValidation)

    await promise

    expect(depositFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'invalid amount',
    )
  })

  it('should emit "deposit-failed-validation" if amount is below minimum deposit limit', async function () {
    const minimumDeposit = BigInt(150)
    vi.mocked(asset).mockResolvedValue(zeroAddress)
    vi.mocked(getMinimumDepositLimit).mockResolvedValue(minimumDeposit)

    const { emitter, promise } = depositToken({
      ...validParameters,
      amount: minimumDeposit - BigInt(1),
    })

    const depositFailedValidation = vi.fn()
    emitter.on('deposit-failed-validation', depositFailedValidation)

    await promise

    expect(depositFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'amount below minimum deposit limit',
    )
  })

  it('should emit "deposit-failed-validation" if user has insufficient balance', async function () {
    vi.mocked(asset).mockResolvedValue(zeroAddress)
    vi.mocked(getMinimumDepositLimit).mockResolvedValue(BigInt(1))
    vi.mocked(balanceOf).mockResolvedValue(validParameters.amount - BigInt(1))
    vi.mocked(maxDeposit).mockResolvedValue(BigInt(1000))

    const { emitter, promise } = depositToken(validParameters)

    const depositFailedValidation = vi.fn()
    emitter.on('deposit-failed-validation', depositFailedValidation)

    await promise

    expect(depositFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'insufficient balance',
    )
  })

  it('should emit "deposit-failed-validation" if amount exceeds max deposit limit', async function () {
    vi.mocked(asset).mockResolvedValue(zeroAddress)
    vi.mocked(getMinimumDepositLimit).mockResolvedValue(BigInt(1))
    vi.mocked(balanceOf).mockResolvedValue(validParameters.amount)
    vi.mocked(maxDeposit).mockResolvedValue(validParameters.amount - BigInt(1))

    const { emitter, promise } = depositToken(validParameters)

    const depositFailedValidation = vi.fn()
    emitter.on('deposit-failed-validation', depositFailedValidation)

    await promise

    expect(depositFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'amount exceeds max deposit limit',
    )
  })

  it('should emit "deposit-failed-validation" when validation fails due to error', async function () {
    vi.mocked(asset).mockResolvedValue(zeroAddress)
    vi.mocked(getMinimumDepositLimit).mockResolvedValue(BigInt(1))
    vi.mocked(balanceOf).mockRejectedValue(new Error('Network error'))

    const { emitter, promise } = depositToken(validParameters)

    const depositFailedValidation = vi.fn()
    emitter.on('deposit-failed-validation', depositFailedValidation)

    await promise

    expect(depositFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'failed to validate inputs',
    )
  })

  it('should skip approval if allowance is sufficient and proceed to deposit', async function () {
    const receipt = {
      status: 'success',
    } as TransactionReceipt

    vi.mocked(asset).mockResolvedValue(zeroAddress)
    vi.mocked(getMinimumDepositLimit).mockResolvedValue(BigInt(1))
    vi.mocked(balanceOf).mockResolvedValue(validParameters.amount)
    vi.mocked(maxDeposit).mockResolvedValue(BigInt(1000))
    vi.mocked(allowance).mockResolvedValue(validParameters.amount)
    vi.mocked(vaultDeposit).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = depositToken(validParameters)

    const onPreApprove = vi.fn()
    const onPreDeposit = vi.fn()
    const onUserSignedDeposit = vi.fn()
    const onDepositTransactionSucceeded = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-approve', onPreApprove)
    emitter.on('pre-deposit', onPreDeposit)
    emitter.on('user-signed-deposit', onUserSignedDeposit)
    emitter.on('deposit-transaction-succeeded', onDepositTransactionSucceeded)
    emitter.on('deposit-settled', onSettled)

    await promise

    expect(onPreApprove).not.toHaveBeenCalled()
    expect(onPreDeposit).toHaveBeenCalledOnce()
    expect(onUserSignedDeposit).toHaveBeenCalledExactlyOnceWith(zeroHash)
    expect(onDepositTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(
      receipt,
    )
    expect(approve).not.toHaveBeenCalled()
    expect(vaultDeposit).toHaveBeenCalledOnce()
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should approve first if allowance is insufficient, then deposit', async function () {
    const approvalReceipt = {
      status: 'success',
    } as TransactionReceipt
    const depositReceipt = {
      status: 'success',
    } as TransactionReceipt

    vi.mocked(asset).mockResolvedValue(zeroAddress)
    vi.mocked(getMinimumDepositLimit).mockResolvedValue(BigInt(1))
    vi.mocked(balanceOf).mockResolvedValue(validParameters.amount)
    vi.mocked(maxDeposit).mockResolvedValue(BigInt(1000))
    vi.mocked(allowance).mockResolvedValue(validParameters.amount - BigInt(1))
    vi.mocked(approve).mockResolvedValue(zeroHash)
    vi.mocked(vaultDeposit).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt)
      .mockResolvedValueOnce(approvalReceipt) // First call for approval
      .mockResolvedValueOnce(depositReceipt) // Second call for deposit

    const { emitter, promise } = depositToken(validParameters)

    const onPreApprove = vi.fn()
    const onUserSignedApproval = vi.fn()
    const onApproveTransactionSucceeded = vi.fn()
    const onPreDeposit = vi.fn()
    const onUserSignedDeposit = vi.fn()
    const onDepositTransactionSucceeded = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-approve', onPreApprove)
    emitter.on('user-signed-approval', onUserSignedApproval)
    emitter.on('approve-transaction-succeeded', onApproveTransactionSucceeded)
    emitter.on('pre-deposit', onPreDeposit)
    emitter.on('user-signed-deposit', onUserSignedDeposit)
    emitter.on('deposit-transaction-succeeded', onDepositTransactionSucceeded)
    emitter.on('deposit-settled', onSettled)

    await promise

    expect(onPreApprove).toHaveBeenCalledOnce()
    expect(onUserSignedApproval).toHaveBeenCalledExactlyOnceWith(zeroHash)
    expect(onApproveTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(
      approvalReceipt,
    )
    expect(onPreDeposit).toHaveBeenCalledOnce()
    expect(onUserSignedDeposit).toHaveBeenCalledExactlyOnceWith(zeroHash)
    expect(onDepositTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(
      depositReceipt,
    )
    expect(approve).toHaveBeenCalledOnce()
    expect(vaultDeposit).toHaveBeenCalledOnce()
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "approve-transaction-reverted" when approval transaction reverts', async function () {
    const approvalReceipt = {
      status: 'reverted',
    } as TransactionReceipt

    vi.mocked(asset).mockResolvedValue(zeroAddress)
    vi.mocked(getMinimumDepositLimit).mockResolvedValue(BigInt(1))
    vi.mocked(balanceOf).mockResolvedValue(validParameters.amount)
    vi.mocked(maxDeposit).mockResolvedValue(BigInt(1000))
    vi.mocked(allowance).mockResolvedValue(validParameters.amount - BigInt(1))
    vi.mocked(approve).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(approvalReceipt)

    const { emitter, promise } = depositToken(validParameters)

    const onPreApprove = vi.fn()
    const onUserSignedApproval = vi.fn()
    const onApproveTransactionReverted = vi.fn()
    const onApproveTransactionSucceeded = vi.fn()
    const onPreDeposit = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-approve', onPreApprove)
    emitter.on('user-signed-approval', onUserSignedApproval)
    emitter.on('approve-transaction-reverted', onApproveTransactionReverted)
    emitter.on('approve-transaction-succeeded', onApproveTransactionSucceeded)
    emitter.on('pre-deposit', onPreDeposit)
    emitter.on('deposit-settled', onSettled)

    await promise

    expect(onPreApprove).toHaveBeenCalledOnce()
    expect(onUserSignedApproval).toHaveBeenCalledExactlyOnceWith(zeroHash)
    expect(onApproveTransactionReverted).toHaveBeenCalledExactlyOnceWith(
      approvalReceipt,
    )
    expect(onApproveTransactionSucceeded).not.toHaveBeenCalled()
    expect(onPreDeposit).not.toHaveBeenCalled()
    expect(approve).toHaveBeenCalledOnce()
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "user-signing-approval-error" when approval signing fails', async function () {
    vi.mocked(asset).mockResolvedValue(zeroAddress)
    vi.mocked(getMinimumDepositLimit).mockResolvedValue(BigInt(1))
    vi.mocked(balanceOf).mockResolvedValue(validParameters.amount)
    vi.mocked(maxDeposit).mockResolvedValue(BigInt(1000))
    vi.mocked(allowance).mockResolvedValue(validParameters.amount - BigInt(1))
    // Mock approve to reject
    vi.mocked(approve).mockRejectedValue(new Error('Approval signing error'))

    const { emitter, promise } = depositToken(validParameters)

    const onPreApprove = vi.fn()
    const onUserSigningApprovalError = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-approve', onPreApprove)
    emitter.on('user-signing-approval-error', onUserSigningApprovalError)
    emitter.on('deposit-settled', onSettled)

    await promise

    expect(onPreApprove).toHaveBeenCalledOnce()
    expect(onUserSigningApprovalError).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "deposit-failed" when approval receipt fails', async function () {
    vi.mocked(asset).mockResolvedValue(zeroAddress)
    vi.mocked(getMinimumDepositLimit).mockResolvedValue(BigInt(1))
    vi.mocked(balanceOf).mockResolvedValue(validParameters.amount)
    vi.mocked(maxDeposit).mockResolvedValue(BigInt(1000))
    vi.mocked(allowance).mockResolvedValue(validParameters.amount - BigInt(1))
    vi.mocked(approve).mockResolvedValue(zeroHash)
    // Mock the first call to waitForTransactionReceipt (for approval) to fail
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(
      new Error('Receipt error'),
    )

    const { emitter, promise } = depositToken(validParameters)

    const onPreApprove = vi.fn()
    const onUserSignedApproval = vi.fn()
    const onDepositFailed = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-approve', onPreApprove)
    emitter.on('user-signed-approval', onUserSignedApproval)
    emitter.on('deposit-failed', onDepositFailed)
    emitter.on('deposit-settled', onSettled)

    await promise

    expect(onPreApprove).toHaveBeenCalledOnce()
    expect(onUserSignedApproval).toHaveBeenCalledExactlyOnceWith(zeroHash)
    expect(onDepositFailed).toHaveBeenCalledExactlyOnceWith(expect.any(Error))
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "user-signing-deposit-error" when deposit signing fails', async function () {
    vi.mocked(asset).mockResolvedValue(zeroAddress)
    vi.mocked(getMinimumDepositLimit).mockResolvedValue(BigInt(1))
    vi.mocked(balanceOf).mockResolvedValue(BigInt(200))
    vi.mocked(maxDeposit).mockResolvedValue(BigInt(1000))
    vi.mocked(allowance).mockResolvedValue(BigInt(200))
    // Mock deposit to reject
    vi.mocked(vaultDeposit).mockRejectedValue(
      new Error('Deposit signing error'),
    )

    const { emitter, promise } = depositToken(validParameters)

    const onPreDeposit = vi.fn()
    const onUserSigningDepositError = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-deposit', onPreDeposit)
    emitter.on('user-signing-deposit-error', onUserSigningDepositError)
    emitter.on('deposit-settled', onSettled)

    await promise

    expect(onPreDeposit).toHaveBeenCalledOnce()
    expect(onUserSigningDepositError).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "deposit-failed" when deposit receipt fails', async function () {
    vi.mocked(asset).mockResolvedValue(zeroAddress)
    vi.mocked(getMinimumDepositLimit).mockResolvedValue(BigInt(1))
    vi.mocked(balanceOf).mockResolvedValue(BigInt(200))
    vi.mocked(maxDeposit).mockResolvedValue(BigInt(1000))
    vi.mocked(allowance).mockResolvedValue(BigInt(200))
    vi.mocked(vaultDeposit).mockResolvedValue(zeroHash)
    // Mock waitForTransactionReceipt to reject on second call (for deposit)
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(
      new Error('Receipt error'),
    )

    const { emitter, promise } = depositToken(validParameters)

    const onPreDeposit = vi.fn()
    const onUserSignedDeposit = vi.fn()
    const onDepositFailed = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-deposit', onPreDeposit)
    emitter.on('user-signed-deposit', onUserSignedDeposit)
    emitter.on('deposit-failed', onDepositFailed)
    emitter.on('deposit-settled', onSettled)

    await promise

    expect(onPreDeposit).toHaveBeenCalledOnce()
    expect(onUserSignedDeposit).toHaveBeenCalledExactlyOnceWith(zeroHash)
    expect(onDepositFailed).toHaveBeenCalledExactlyOnceWith(expect.any(Error))
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "deposit-transaction-reverted" when deposit transaction reverts', async function () {
    const receipt = {
      status: 'reverted',
    } as TransactionReceipt

    vi.mocked(asset).mockResolvedValue(zeroAddress)
    vi.mocked(getMinimumDepositLimit).mockResolvedValue(BigInt(1))
    vi.mocked(balanceOf).mockResolvedValue(BigInt(200))
    vi.mocked(maxDeposit).mockResolvedValue(BigInt(1000))
    vi.mocked(allowance).mockResolvedValue(BigInt(200))
    vi.mocked(vaultDeposit).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = depositToken(validParameters)

    const onPreDeposit = vi.fn()
    const onUserSignedDeposit = vi.fn()
    const onDepositTransactionReverted = vi.fn()
    const onDepositTransactionSucceeded = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-deposit', onPreDeposit)
    emitter.on('user-signed-deposit', onUserSignedDeposit)
    emitter.on('deposit-transaction-reverted', onDepositTransactionReverted)
    emitter.on('deposit-transaction-succeeded', onDepositTransactionSucceeded)
    emitter.on('deposit-settled', onSettled)

    await promise

    expect(onPreDeposit).toHaveBeenCalledOnce()
    expect(onUserSignedDeposit).toHaveBeenCalledExactlyOnceWith(zeroHash)
    expect(onDepositTransactionReverted).toHaveBeenCalledExactlyOnceWith(
      receipt,
    )
    expect(onDepositTransactionSucceeded).not.toHaveBeenCalled()
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "unexpected-error" when an unexpected error occurs', async function () {
    vi.mocked(asset).mockRejectedValue(
      new Error('Chain is not defined on wallet'),
    )

    const { emitter, promise } = depositToken(validParameters)

    const onUnexpectedError = vi.fn()
    const onSettled = vi.fn()

    emitter.on('unexpected-error', onUnexpectedError)
    emitter.on('deposit-settled', onSettled)

    await promise

    expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(expect.any(Error))
    expect(onSettled).toHaveBeenCalledOnce()
  })
})
