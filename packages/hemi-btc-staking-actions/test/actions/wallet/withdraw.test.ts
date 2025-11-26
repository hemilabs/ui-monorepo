import { hemiSepolia } from 'hemi-viem'
import {
  type TransactionReceipt,
  type WalletClient,
  zeroAddress,
  zeroHash,
} from 'viem'
import { waitForTransactionReceipt } from 'viem/actions'
import { balanceOf, redeem } from 'viem-erc4626/actions'
import { describe, expect, it, vi } from 'vitest'

import { withdraw } from '../../../src/actions/wallet/withdraw'
import { getBtcStakingVaultContractAddress } from '../../../src/constants'

vi.mock('viem/actions', () => ({
  waitForTransactionReceipt: vi.fn(),
}))

vi.mock('viem-erc4626/actions', () => ({
  balanceOf: vi.fn(),
  redeem: vi.fn(),
}))

const mockWalletClient = {
  chain: hemiSepolia,
} as unknown as WalletClient

const validParameters = {
  account: zeroAddress,
  owner: zeroAddress,
  receiver: zeroAddress,
  shares: BigInt(100),
  walletClient: mockWalletClient,
}

describe('withdraw', function () {
  it('should emit "unexpected-error" if wallet client chain is not defined', async function () {
    const walletClientWithoutChain = {} as WalletClient

    // Mock balanceOf to avoid it being called before chain validation
    vi.mocked(balanceOf).mockResolvedValue(BigInt(100))

    const { emitter, promise } = withdraw({
      ...validParameters,
      walletClient: walletClientWithoutChain,
    })

    const onUnexpectedError = vi.fn()
    const onSettled = vi.fn()
    emitter.on('unexpected-error', onUnexpectedError)
    emitter.on('withdraw-settled', onSettled)

    await promise

    expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(expect.any(Error))
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "withdraw-failed-validation" if shares are zero', async function () {
    // Mock balanceOf since it's called before validation
    vi.mocked(balanceOf).mockResolvedValue(BigInt(100))

    const { emitter, promise } = withdraw({
      ...validParameters,
      shares: BigInt(0),
    })

    const withdrawFailedValidation = vi.fn()
    emitter.on('withdraw-failed-validation', withdrawFailedValidation)

    await promise

    expect(withdrawFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'invalid shares amount',
    )
  })

  it('should emit "withdraw-failed-validation" if shares are negative', async function () {
    // Mock balanceOf since it's called before validation
    vi.mocked(balanceOf).mockResolvedValue(BigInt(100))

    const { emitter, promise } = withdraw({
      ...validParameters,
      shares: BigInt(-1),
    })

    const withdrawFailedValidation = vi.fn()
    emitter.on('withdraw-failed-validation', withdrawFailedValidation)

    await promise

    expect(withdrawFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'invalid shares amount',
    )
  })

  it('should emit "withdraw-failed-validation" if shares are undefined', async function () {
    // Mock balanceOf since it's called before validation
    vi.mocked(balanceOf).mockResolvedValue(BigInt(100))

    const { emitter, promise } = withdraw({
      ...validParameters,
      // @ts-expect-error testing invalid input
      shares: undefined,
    })

    const withdrawFailedValidation = vi.fn()
    emitter.on('withdraw-failed-validation', withdrawFailedValidation)

    await promise

    expect(withdrawFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'invalid shares amount',
    )
  })

  it('should emit "withdraw-failed-validation" if user has insufficient shares balance', async function () {
    vi.mocked(balanceOf).mockResolvedValue(validParameters.shares - BigInt(1))

    const { emitter, promise } = withdraw(validParameters)

    const withdrawFailedValidation = vi.fn()
    emitter.on('withdraw-failed-validation', withdrawFailedValidation)

    await promise

    expect(withdrawFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'insufficient shares balance',
    )
  })

  it('should emit "withdraw-transaction-succeeded" when withdraw succeeds', async function () {
    const receipt = {
      status: 'success',
    } as TransactionReceipt

    vi.mocked(balanceOf).mockResolvedValue(validParameters.shares)
    vi.mocked(redeem).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = withdraw(validParameters)

    const onPreWithdraw = vi.fn()
    const onUserSignedWithdraw = vi.fn()
    const onWithdrawTransactionSucceeded = vi.fn()
    const onWithdrawTransactionReverted = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-withdraw', onPreWithdraw)
    emitter.on('user-signed-withdraw', onUserSignedWithdraw)
    emitter.on('withdraw-transaction-succeeded', onWithdrawTransactionSucceeded)
    emitter.on('withdraw-transaction-reverted', onWithdrawTransactionReverted)
    emitter.on('withdraw-settled', onSettled)

    await promise

    expect(onPreWithdraw).toHaveBeenCalledOnce()
    expect(onUserSignedWithdraw).toHaveBeenCalledExactlyOnceWith(zeroHash)
    expect(onWithdrawTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(
      receipt,
    )
    expect(onWithdrawTransactionReverted).not.toHaveBeenCalled()
    expect(redeem).toHaveBeenCalledExactlyOnceWith(
      validParameters.walletClient,
      {
        address: getBtcStakingVaultContractAddress(
          validParameters.walletClient.chain!.id,
        ),
        owner: validParameters.owner,
        receiver: validParameters.receiver,
        shares: validParameters.shares,
      },
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "user-signing-withdraw-error" when withdraw signing fails', async function () {
    vi.mocked(balanceOf).mockResolvedValue(validParameters.shares)
    vi.mocked(redeem).mockRejectedValue(new Error('Withdraw signing error'))

    const { emitter, promise } = withdraw(validParameters)

    const onPreWithdraw = vi.fn()
    const onUserSigningWithdrawError = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-withdraw', onPreWithdraw)
    emitter.on('user-signing-withdraw-error', onUserSigningWithdrawError)
    emitter.on('withdraw-settled', onSettled)

    await promise

    expect(onPreWithdraw).toHaveBeenCalledOnce()
    expect(onUserSigningWithdrawError).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "withdraw-failed" when withdraw receipt fails', async function () {
    vi.mocked(balanceOf).mockResolvedValue(validParameters.shares)
    vi.mocked(redeem).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(
      new Error('Receipt error'),
    )

    const { emitter, promise } = withdraw(validParameters)

    const onPreWithdraw = vi.fn()
    const onUserSignedWithdraw = vi.fn()
    const onWithdrawFailed = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-withdraw', onPreWithdraw)
    emitter.on('user-signed-withdraw', onUserSignedWithdraw)
    emitter.on('withdraw-failed', onWithdrawFailed)
    emitter.on('withdraw-settled', onSettled)

    await promise

    expect(onPreWithdraw).toHaveBeenCalledOnce()
    expect(onUserSignedWithdraw).toHaveBeenCalledExactlyOnceWith(zeroHash)
    expect(onWithdrawFailed).toHaveBeenCalledExactlyOnceWith(expect.any(Error))
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "withdraw-transaction-reverted" when withdraw transaction reverts', async function () {
    const receipt = {
      status: 'reverted',
    } as TransactionReceipt

    vi.mocked(balanceOf).mockResolvedValue(validParameters.shares)
    vi.mocked(redeem).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = withdraw(validParameters)

    const onPreWithdraw = vi.fn()
    const onUserSignedWithdraw = vi.fn()
    const onWithdrawTransactionReverted = vi.fn()
    const onWithdrawTransactionSucceeded = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-withdraw', onPreWithdraw)
    emitter.on('user-signed-withdraw', onUserSignedWithdraw)
    emitter.on('withdraw-transaction-reverted', onWithdrawTransactionReverted)
    emitter.on('withdraw-transaction-succeeded', onWithdrawTransactionSucceeded)
    emitter.on('withdraw-settled', onSettled)

    await promise

    expect(onPreWithdraw).toHaveBeenCalledOnce()
    expect(onUserSignedWithdraw).toHaveBeenCalledExactlyOnceWith(zeroHash)
    expect(onWithdrawTransactionReverted).toHaveBeenCalledExactlyOnceWith(
      receipt,
    )
    expect(onWithdrawTransactionSucceeded).not.toHaveBeenCalled()
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "unexpected-error" when an unexpected error occurs', async function () {
    vi.mocked(balanceOf).mockResolvedValue(validParameters.shares)
    // Mock a scenario that would trigger the catch block with a non-validation error
    vi.mocked(redeem).mockImplementation(function () {
      throw new Error('Unexpected error')
    })

    const { emitter, promise } = withdraw(validParameters)

    const onUnexpectedError = vi.fn()
    const onSettled = vi.fn()

    emitter.on('unexpected-error', onUnexpectedError)
    emitter.on('withdraw-settled', onSettled)

    await promise

    expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(expect.any(Error))
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should withdraw the full share balance when shares amount is exactly 99.9% of user balance', async function () {
    const userBalance = BigInt(1000)
    // Exactly 99.9%
    const requestedShares = (userBalance * BigInt(999)) / BigInt(1000)
    const receipt = { status: 'success' } as TransactionReceipt

    vi.mocked(balanceOf).mockResolvedValue(userBalance)
    vi.mocked(redeem).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = withdraw({
      ...validParameters,
      shares: requestedShares,
    })

    const onWithdrawTransactionSucceeded = vi.fn()
    emitter.on('withdraw-transaction-succeeded', onWithdrawTransactionSucceeded)

    await promise

    expect(onWithdrawTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(
      receipt,
    )
    expect(redeem).toHaveBeenCalledExactlyOnceWith(
      validParameters.walletClient,
      {
        address: getBtcStakingVaultContractAddress(
          validParameters.walletClient.chain!.id,
        ),
        owner: validParameters.owner,
        receiver: validParameters.receiver,
        // Should use full balance, not requested shares
        shares: userBalance,
      },
    )
  })

  it('should withdraw the full share balance when shares amount is greater than 99.9% of user balance', async function () {
    const userBalance = BigInt(1000)
    // 99.99% which is > 99.9% threshold
    const requestedShares = (userBalance * BigInt(9999)) / BigInt(10000)
    const receipt = { status: 'success' } as TransactionReceipt

    vi.mocked(balanceOf).mockResolvedValue(userBalance)
    vi.mocked(redeem).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = withdraw({
      ...validParameters,
      shares: requestedShares,
    })

    const onWithdrawTransactionSucceeded = vi.fn()
    emitter.on('withdraw-transaction-succeeded', onWithdrawTransactionSucceeded)

    await promise

    expect(onWithdrawTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(
      receipt,
    )
    expect(redeem).toHaveBeenCalledExactlyOnceWith(
      validParameters.walletClient,
      {
        address: getBtcStakingVaultContractAddress(
          validParameters.walletClient.chain!.id,
        ),
        owner: validParameters.owner,
        receiver: validParameters.receiver,
        // Should use full balance, not requested shares
        shares: userBalance,
      },
    )
  })
})
