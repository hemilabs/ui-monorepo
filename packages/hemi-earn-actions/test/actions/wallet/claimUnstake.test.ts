import {
  type Address,
  type TransactionReceipt,
  type WalletClient,
  zeroAddress,
  zeroHash,
} from 'viem'
import {
  getBalance,
  waitForTransactionReceipt,
  writeContract,
} from 'viem/actions'
import { mainnet } from 'viem/chains'
import { describe, expect, it, vi } from 'vitest'

import { claimUnstake } from '../../../src/actions/wallet/claimUnstake'

vi.mock('viem/actions', () => ({
  getBalance: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}))

const mockWalletClient = {
  chain: mainnet,
} as unknown as WalletClient

const agentAddress = '0x000000000000000000000000000000000000dEaD' as Address

const validParameters = {
  account: zeroAddress,
  agentAddress,
  nativeFee: BigInt(7),
  requestId: BigInt(1),
  walletClient: mockWalletClient,
}

describe('claimUnstake', function () {
  it('emits "unexpected-error" when wallet client chain is not defined', async function () {
    const { emitter, promise } = claimUnstake({
      ...validParameters,
      walletClient: {} as WalletClient,
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
    const { emitter, promise } = claimUnstake({
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

  it('happy path: signs with the native-fee top-up and emits succeeded', async function () {
    const receipt = { status: 'success' } as TransactionReceipt

    vi.mocked(getBalance).mockResolvedValue(BigInt(1000))
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = claimUnstake(validParameters)

    const onUserSigned = vi.fn()
    const onSucceeded = vi.fn()
    emitter.on('user-signed-tx', onUserSigned)
    emitter.on('tx-transaction-succeeded', onSucceeded)

    await promise

    expect(onUserSigned).toHaveBeenCalledExactlyOnceWith(zeroHash)
    expect(onSucceeded).toHaveBeenCalledExactlyOnceWith(receipt)
    expect(writeContract).toHaveBeenCalledWith(
      mockWalletClient,
      expect.objectContaining({
        address: agentAddress,
        args: [validParameters.requestId],
        functionName: 'claimUnstake',
        value: validParameters.nativeFee,
      }),
    )
  })

  it('emits "tx-transaction-reverted" when receipt is reverted', async function () {
    const receipt = { status: 'reverted' } as TransactionReceipt

    vi.mocked(getBalance).mockResolvedValue(BigInt(1000))
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = claimUnstake(validParameters)

    const onReverted = vi.fn()
    emitter.on('tx-transaction-reverted', onReverted)

    await promise

    expect(onReverted).toHaveBeenCalledExactlyOnceWith(receipt)
  })

  it('emits "user-signing-tx-error" when signing fails', async function () {
    vi.mocked(getBalance).mockResolvedValue(BigInt(1000))
    vi.mocked(writeContract).mockRejectedValue(new Error('user rejected'))

    const { emitter, promise } = claimUnstake(validParameters)

    const onSigningError = vi.fn()
    emitter.on('user-signing-tx-error', onSigningError)

    await promise

    expect(onSigningError).toHaveBeenCalledExactlyOnceWith(expect.any(Error))
  })

  it('emits "tx-failed-validation" when the balance is below the fee', async function () {
    vi.mocked(getBalance).mockResolvedValue(BigInt(1))

    const { emitter, promise } = claimUnstake(validParameters)

    const onFailedValidation = vi.fn()
    emitter.on('tx-failed-validation', onFailedValidation)

    await promise

    expect(onFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'insufficient balance for fee',
    )
    expect(writeContract).not.toHaveBeenCalled()
  })
})
