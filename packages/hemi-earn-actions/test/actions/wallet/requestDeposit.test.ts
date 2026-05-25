import { hemi } from 'hemi-viem'
import {
  type TransactionReceipt,
  type WalletClient,
  zeroAddress,
  zeroHash,
} from 'viem'
import { waitForTransactionReceipt, writeContract } from 'viem/actions'
import { allowance, approve, balanceOf } from 'viem-erc20/actions'
import { describe, expect, it, vi } from 'vitest'

import { quoteDeposit } from '../../../src/actions/public/quoteDeposit'
import { requestDeposit } from '../../../src/actions/wallet/requestDeposit'

vi.mock('viem/actions', () => ({
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}))

vi.mock('viem-erc20/actions', () => ({
  allowance: vi.fn(),
  approve: vi.fn(),
  balanceOf: vi.fn(),
}))

vi.mock('../../../src/actions/public/quoteDeposit', () => ({
  quoteDeposit: vi.fn(),
}))

const mockWalletClient = {
  chain: hemi,
} as unknown as WalletClient

const validParameters = {
  account: zeroAddress,
  amount: BigInt(100),
  asset: zeroAddress,
  fulfillmentFee: BigInt(0),
  operator: zeroAddress,
  receiver: zeroAddress,
  routerAddress: zeroAddress,
  walletClient: mockWalletClient,
}

describe('requestDeposit', function () {
  it('emits "unexpected-error" when wallet client chain is not defined', async function () {
    const walletClientWithoutChain = {} as WalletClient

    const { emitter, promise } = requestDeposit({
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

  it('emits "deposit-failed-validation" when amount is zero', async function () {
    const { emitter, promise } = requestDeposit({
      ...validParameters,
      amount: BigInt(0),
    })

    const onFailedValidation = vi.fn()
    emitter.on('deposit-failed-validation', onFailedValidation)

    await promise

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith('invalid amount')
  })

  it('emits "deposit-failed-validation" when balance is insufficient', async function () {
    vi.mocked(balanceOf).mockResolvedValue(validParameters.amount - BigInt(1))

    const { emitter, promise } = requestDeposit(validParameters)

    const onFailedValidation = vi.fn()
    emitter.on('deposit-failed-validation', onFailedValidation)

    await promise

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'insufficient balance',
    )
  })

  it('emits "deposit-failed-validation" when balance read throws', async function () {
    vi.mocked(balanceOf).mockRejectedValue(new Error('rpc error'))

    const { emitter, promise } = requestDeposit(validParameters)

    const onFailedValidation = vi.fn()
    emitter.on('deposit-failed-validation', onFailedValidation)

    await promise

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'failed to validate inputs',
    )
  })

  it('emits "quote-failed" when quoteDeposit throws', async function () {
    vi.mocked(balanceOf).mockResolvedValue(validParameters.amount)
    vi.mocked(quoteDeposit).mockRejectedValue(new Error('quote error'))

    const { emitter, promise } = requestDeposit(validParameters)

    const onPreQuote = vi.fn()
    const onQuoteFailed = vi.fn()
    const onSettled = vi.fn()
    emitter.on('pre-quote', onPreQuote)
    emitter.on('quote-failed', onQuoteFailed)
    emitter.on('deposit-settled', onSettled)

    await promise

    expect(onPreQuote).toHaveBeenCalledOnce()
    expect(onQuoteFailed).toHaveBeenCalledExactlyOnceWith(expect.any(Error))
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('skips approval and submits request when allowance is sufficient', async function () {
    const receipt = { status: 'success' } as TransactionReceipt

    vi.mocked(balanceOf).mockResolvedValue(validParameters.amount)
    vi.mocked(quoteDeposit).mockResolvedValue(BigInt(42))
    vi.mocked(allowance).mockResolvedValue(validParameters.amount)
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = requestDeposit(validParameters)

    const onQuoteSucceeded = vi.fn()
    const onCheckAllowance = vi.fn()
    const onPreApprove = vi.fn()
    const onPreDeposit = vi.fn()
    const onUserSignedDeposit = vi.fn()
    const onSucceeded = vi.fn()
    const onSettled = vi.fn()
    emitter.on('quote-succeeded', onQuoteSucceeded)
    emitter.on('check-allowance', onCheckAllowance)
    emitter.on('pre-approve', onPreApprove)
    emitter.on('pre-deposit', onPreDeposit)
    emitter.on('user-signed-deposit', onUserSignedDeposit)
    emitter.on('deposit-transaction-succeeded', onSucceeded)
    emitter.on('deposit-settled', onSettled)

    await promise

    expect(onQuoteSucceeded).toHaveBeenCalledExactlyOnceWith(BigInt(42))
    expect(onCheckAllowance).toHaveBeenCalledOnce()
    expect(onPreApprove).not.toHaveBeenCalled()
    expect(onPreDeposit).toHaveBeenCalledOnce()
    expect(onUserSignedDeposit).toHaveBeenCalledExactlyOnceWith(zeroHash)
    expect(onSucceeded).toHaveBeenCalledExactlyOnceWith(receipt)
    expect(approve).not.toHaveBeenCalled()
    expect(writeContract).toHaveBeenCalledWith(
      mockWalletClient,
      expect.objectContaining({
        args: [
          zeroAddress,
          validParameters.amount,
          BigInt(0),
          zeroAddress,
          zeroAddress,
          true,
          BigInt(0),
        ],
        functionName: 'requestDeposit',
        value: BigInt(42),
      }),
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('approves first when allowance is insufficient, then submits request', async function () {
    const approvalReceipt = { status: 'success' } as TransactionReceipt
    const depositReceipt = { status: 'success' } as TransactionReceipt

    vi.mocked(balanceOf).mockResolvedValue(validParameters.amount)
    vi.mocked(quoteDeposit).mockResolvedValue(BigInt(7))
    vi.mocked(allowance).mockResolvedValue(BigInt(0))
    vi.mocked(approve).mockResolvedValue(zeroHash)
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt)
      .mockResolvedValueOnce(approvalReceipt)
      .mockResolvedValueOnce(depositReceipt)

    const { emitter, promise } = requestDeposit(validParameters)

    const onPreApprove = vi.fn()
    const onApproveSucceeded = vi.fn()
    const onPreDeposit = vi.fn()
    const onSucceeded = vi.fn()
    const onSettled = vi.fn()
    emitter.on('pre-approve', onPreApprove)
    emitter.on('approve-transaction-succeeded', onApproveSucceeded)
    emitter.on('pre-deposit', onPreDeposit)
    emitter.on('deposit-transaction-succeeded', onSucceeded)
    emitter.on('deposit-settled', onSettled)

    await promise

    expect(onPreApprove).toHaveBeenCalledOnce()
    expect(onApproveSucceeded).toHaveBeenCalledExactlyOnceWith(approvalReceipt)
    expect(onPreDeposit).toHaveBeenCalledOnce()
    expect(onSucceeded).toHaveBeenCalledExactlyOnceWith(depositReceipt)
    expect(approve).toHaveBeenCalledOnce()
    expect(writeContract).toHaveBeenCalledOnce()
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('emits "approve-transaction-reverted" when approval reverts', async function () {
    const approvalReceipt = { status: 'reverted' } as TransactionReceipt

    vi.mocked(balanceOf).mockResolvedValue(validParameters.amount)
    vi.mocked(quoteDeposit).mockResolvedValue(BigInt(0))
    vi.mocked(allowance).mockResolvedValue(BigInt(0))
    vi.mocked(approve).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(approvalReceipt)

    const { emitter, promise } = requestDeposit(validParameters)

    const onApproveReverted = vi.fn()
    const onPreDeposit = vi.fn()
    const onSettled = vi.fn()
    emitter.on('approve-transaction-reverted', onApproveReverted)
    emitter.on('pre-deposit', onPreDeposit)
    emitter.on('deposit-settled', onSettled)

    await promise

    expect(onApproveReverted).toHaveBeenCalledExactlyOnceWith(approvalReceipt)
    expect(onPreDeposit).not.toHaveBeenCalled()
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('emits "user-signing-deposit-error" when request signing fails', async function () {
    vi.mocked(balanceOf).mockResolvedValue(validParameters.amount)
    vi.mocked(quoteDeposit).mockResolvedValue(BigInt(0))
    vi.mocked(allowance).mockResolvedValue(validParameters.amount)
    vi.mocked(writeContract).mockRejectedValue(new Error('user rejected'))

    const { emitter, promise } = requestDeposit(validParameters)

    const onSigningError = vi.fn()
    const onSettled = vi.fn()
    emitter.on('user-signing-deposit-error', onSigningError)
    emitter.on('deposit-settled', onSettled)

    await promise

    expect(onSigningError).toHaveBeenCalledExactlyOnceWith(expect.any(Error))
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('emits "deposit-transaction-reverted" when request tx reverts', async function () {
    const receipt = { status: 'reverted' } as TransactionReceipt

    vi.mocked(balanceOf).mockResolvedValue(validParameters.amount)
    vi.mocked(quoteDeposit).mockResolvedValue(BigInt(0))
    vi.mocked(allowance).mockResolvedValue(validParameters.amount)
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = requestDeposit(validParameters)

    const onReverted = vi.fn()
    const onSettled = vi.fn()
    emitter.on('deposit-transaction-reverted', onReverted)
    emitter.on('deposit-settled', onSettled)

    await promise

    expect(onReverted).toHaveBeenCalledExactlyOnceWith(receipt)
    expect(onSettled).toHaveBeenCalledOnce()
  })
})
