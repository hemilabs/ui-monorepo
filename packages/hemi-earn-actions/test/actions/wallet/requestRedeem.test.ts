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

import { quoteRedeem } from '../../../src/actions/public/quoteRedeem'
import { requestRedeem } from '../../../src/actions/wallet/requestRedeem'

vi.mock('viem/actions', () => ({
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}))

vi.mock('viem-erc20/actions', () => ({
  allowance: vi.fn(),
  approve: vi.fn(),
  balanceOf: vi.fn(),
}))

vi.mock('../../../src/actions/public/quoteRedeem', () => ({
  quoteRedeem: vi.fn(),
}))

const mockWalletClient = {
  chain: hemi,
} as unknown as WalletClient

const validParameters = {
  account: zeroAddress,
  asset: zeroAddress,
  fulfillmentFee: BigInt(0),
  isInstant: false,
  operator: zeroAddress,
  receiver: zeroAddress,
  routerAddress: zeroAddress,
  shares: BigInt(100),
  shareToken: zeroAddress,
  walletClient: mockWalletClient,
}

describe('requestRedeem', function () {
  it('emits "withdraw-failed-validation" when shares is zero', async function () {
    vi.mocked(balanceOf).mockResolvedValue(BigInt(1000))

    const { emitter, promise } = requestRedeem({
      ...validParameters,
      shares: BigInt(0),
    })

    const onFailedValidation = vi.fn()
    emitter.on('withdraw-failed-validation', onFailedValidation)

    await promise

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'invalid shares amount',
    )
  })

  it('emits "withdraw-failed-validation" when shares exceed balance', async function () {
    vi.mocked(balanceOf).mockResolvedValue(BigInt(10))

    const { emitter, promise } = requestRedeem(validParameters)

    const onFailedValidation = vi.fn()
    emitter.on('withdraw-failed-validation', onFailedValidation)

    await promise

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'insufficient shares balance',
    )
  })

  it('emits "withdraw-failed-validation" when balance read fails', async function () {
    vi.mocked(balanceOf).mockRejectedValue(new Error('rpc error'))

    const { emitter, promise } = requestRedeem(validParameters)

    const onFailedValidation = vi.fn()
    emitter.on('withdraw-failed-validation', onFailedValidation)

    await promise

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'failed to validate inputs',
    )
  })

  it('sweeps dust when shares >= 99.9% of balance', async function () {
    const userBalance = BigInt(1000)
    const receipt = { status: 'success' } as TransactionReceipt

    vi.mocked(balanceOf).mockResolvedValue(userBalance)
    vi.mocked(quoteRedeem).mockResolvedValue(BigInt(0))
    vi.mocked(allowance).mockResolvedValue(userBalance)
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = requestRedeem({
      ...validParameters,
      shares: BigInt(999),
    })

    emitter.on('withdraw-transaction-succeeded', () => undefined)

    await promise

    expect(writeContract).toHaveBeenCalledWith(
      mockWalletClient,
      expect.objectContaining({
        args: [
          zeroAddress,
          userBalance,
          BigInt(0),
          zeroAddress,
          zeroAddress,
          true,
          BigInt(0),
          false,
        ],
      }),
    )
  })

  it('happy path: quote, skip approve, submit, succeed', async function () {
    const receipt = { status: 'success' } as TransactionReceipt

    vi.mocked(balanceOf).mockResolvedValue(validParameters.shares)
    vi.mocked(quoteRedeem).mockResolvedValue(BigInt(42))
    vi.mocked(allowance).mockResolvedValue(validParameters.shares)
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = requestRedeem(validParameters)

    const onQuoteSucceeded = vi.fn()
    const onPreWithdraw = vi.fn()
    const onSucceeded = vi.fn()
    const onSettled = vi.fn()
    emitter.on('quote-succeeded', onQuoteSucceeded)
    emitter.on('pre-withdraw', onPreWithdraw)
    emitter.on('withdraw-transaction-succeeded', onSucceeded)
    emitter.on('withdraw-settled', onSettled)

    await promise

    expect(onQuoteSucceeded).toHaveBeenCalledExactlyOnceWith(BigInt(42))
    expect(onPreWithdraw).toHaveBeenCalledOnce()
    expect(onSucceeded).toHaveBeenCalledExactlyOnceWith(receipt)
    expect(approve).not.toHaveBeenCalled()
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('emits "withdraw-transaction-reverted" when request tx reverts', async function () {
    const receipt = { status: 'reverted' } as TransactionReceipt

    vi.mocked(balanceOf).mockResolvedValue(validParameters.shares)
    vi.mocked(quoteRedeem).mockResolvedValue(BigInt(0))
    vi.mocked(allowance).mockResolvedValue(validParameters.shares)
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = requestRedeem(validParameters)

    const onReverted = vi.fn()
    emitter.on('withdraw-transaction-reverted', onReverted)

    await promise

    expect(onReverted).toHaveBeenCalledExactlyOnceWith(receipt)
  })
})
