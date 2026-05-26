import { hemi } from 'hemi-viem'
import {
  type TransactionReceipt,
  type WalletClient,
  zeroAddress,
  zeroHash,
} from 'viem'
import { waitForTransactionReceipt, writeContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { claimDeposit } from '../../../src/actions/wallet/claimDeposit'

vi.mock('viem/actions', () => ({
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}))

const mockWalletClient = {
  chain: hemi,
} as unknown as WalletClient

const validParameters = {
  account: zeroAddress,
  requestId: BigInt(1),
  routerAddress: zeroAddress,
  walletClient: mockWalletClient,
}

describe('claimDeposit', function () {
  it('emits "unexpected-error" when wallet client chain is not defined', async function () {
    const walletClientWithoutChain = {} as WalletClient

    const { emitter, promise } = claimDeposit({
      ...validParameters,
      walletClient: walletClientWithoutChain,
    })

    const onUnexpectedError = vi.fn()
    const onSettled = vi.fn()
    emitter.on('unexpected-error', onUnexpectedError)
    emitter.on('tx-settled', onSettled)

    await promise

    expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(expect.any(Error))
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('emits "tx-failed-validation" when requestId is zero', async function () {
    const { emitter, promise } = claimDeposit({
      ...validParameters,
      requestId: BigInt(0),
    })

    const onFailedValidation = vi.fn()
    emitter.on('tx-failed-validation', onFailedValidation)

    await promise

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'invalid requestId',
    )
  })

  it('happy path: signs, waits receipt, emits succeeded', async function () {
    const receipt = { status: 'success' } as TransactionReceipt

    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = claimDeposit(validParameters)

    const onPreTx = vi.fn()
    const onUserSigned = vi.fn()
    const onSucceeded = vi.fn()
    const onSettled = vi.fn()
    emitter.on('pre-tx', onPreTx)
    emitter.on('user-signed-tx', onUserSigned)
    emitter.on('tx-transaction-succeeded', onSucceeded)
    emitter.on('tx-settled', onSettled)

    await promise

    expect(onPreTx).toHaveBeenCalledOnce()
    expect(onUserSigned).toHaveBeenCalledExactlyOnceWith(zeroHash)
    expect(onSucceeded).toHaveBeenCalledExactlyOnceWith(receipt)
    expect(onSettled).toHaveBeenCalledOnce()
    expect(writeContract).toHaveBeenCalledWith(
      mockWalletClient,
      expect.objectContaining({
        args: [validParameters.requestId],
        functionName: 'claimDeposit',
      }),
    )
  })

  it('emits "tx-transaction-reverted" when receipt is reverted', async function () {
    const receipt = { status: 'reverted' } as TransactionReceipt

    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = claimDeposit(validParameters)

    const onReverted = vi.fn()
    emitter.on('tx-transaction-reverted', onReverted)

    await promise

    expect(onReverted).toHaveBeenCalledExactlyOnceWith(receipt)
  })

  it('emits "user-signing-tx-error" when signing fails', async function () {
    vi.mocked(writeContract).mockRejectedValue(new Error('user rejected'))

    const { emitter, promise } = claimDeposit(validParameters)

    const onSigningError = vi.fn()
    emitter.on('user-signing-tx-error', onSigningError)

    await promise

    expect(onSigningError).toHaveBeenCalledExactlyOnceWith(expect.any(Error))
  })
})
