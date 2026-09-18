import { zeroAddress, zeroHash } from 'viem'
import {
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from 'viem/actions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { claimToken } from '../../../actions'
import * as constants from '../../../constants'
import { veHemiEpochRewardsAbi } from '../../../rewardsAbi'

vi.mock('viem/actions', () => ({
  simulateContract: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}))

// viem resolves a replaced transaction with the replacement's receipt, after reporting
// why it was replaced. A cancel is a zero-value send to self, so that receipt succeeds.
const mockReplacement = (
  reason: string,
  receipt: object = { status: 'success' },
) =>
  vi.mocked(waitForTransactionReceipt).mockImplementation(async function (
    _,
    { onReplaced },
  ) {
    onReplaced?.({ reason })
    return receipt
  })

const mockRewardsAddress = '0x1234567890123456789012345678901234567890'
const chain = { id: 743111 }

const validParameters = {
  account: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as const,
  fromEpoch: 100,
  toEpoch: 163,
  token: '0x4dca037afd39df50bc83c9eaa19714c2b6c9f9fb' as const,
  tokenId: BigInt(1),
  walletClient: { chain },
}

describe('claimToken', function () {
  beforeEach(function () {
    vi.spyOn(constants, 'getVeHemiEpochRewardsContractAddress').mockReturnValue(
      mockRewardsAddress,
    )
  })

  it('should emit "claim-token-failed-validation" if the wallet client has no chain', async function () {
    const { emitter, promise } = claimToken({
      ...validParameters,
      walletClient: {},
    })

    const failedValidation = vi.fn()
    emitter.on('claim-token-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'wallet client chain is not defined',
    )
  })

  it('should emit "claim-token-failed-validation" if the token is not a valid address', async function () {
    const { emitter, promise } = claimToken({
      ...validParameters,
      token: zeroAddress,
    })

    const failedValidation = vi.fn()
    emitter.on('claim-token-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'token is not a valid address',
    )
    expect(simulateContract).not.toHaveBeenCalled()
  })

  it('should emit "claim-token-failed-validation" if the epoch range is inverted', async function () {
    const { emitter, promise } = claimToken({
      ...validParameters,
      fromEpoch: 164,
      toEpoch: 163,
    })

    const failedValidation = vi.fn()
    emitter.on('claim-token-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'epoch range is not valid',
    )
  })

  it('should name the token in the call, with no registry cursor', async function () {
    const receipt = { status: 'success' }
    vi.mocked(simulateContract).mockResolvedValue({ result: undefined })
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = claimToken(validParameters)

    const succeeded = vi.fn()
    const settled = vi.fn()
    emitter.on('claim-token-transaction-succeeded', succeeded)
    emitter.on('claim-token-settled', settled)

    await promise

    const expectedCall = {
      abi: veHemiEpochRewardsAbi,
      account: validParameters.account,
      address: mockRewardsAddress,
      args: [
        BigInt(1),
        validParameters.account,
        validParameters.token,
        100,
        163,
      ],
      chain,
      functionName: 'claimToken',
    }

    expect(simulateContract).toHaveBeenCalledExactlyOnceWith(
      validParameters.walletClient,
      expectedCall,
    )
    expect(writeContract).toHaveBeenCalledExactlyOnceWith(
      validParameters.walletClient,
      expectedCall,
    )
    expect(succeeded).toHaveBeenCalledExactlyOnceWith(receipt)
    expect(settled).toHaveBeenCalledOnce()
  })

  it('should emit "claim-token-failed" and never sign when the simulation reverts', async function () {
    const error = new Error('RewardTokenNotRegistered')
    vi.mocked(simulateContract).mockRejectedValue(error)

    const { emitter, promise } = claimToken(validParameters)

    const failed = vi.fn()
    const preClaim = vi.fn()
    emitter.on('claim-token-failed', failed)
    emitter.on('pre-claim-token', preClaim)

    await promise

    expect(failed).toHaveBeenCalledExactlyOnceWith(error)
    expect(preClaim).not.toHaveBeenCalled()
    expect(writeContract).not.toHaveBeenCalled()
  })

  it('should emit "user-signing-claim-token-error" when the user rejects', async function () {
    const error = new Error('user rejected')
    vi.mocked(simulateContract).mockResolvedValue({ result: undefined })
    vi.mocked(writeContract).mockRejectedValue(error)

    const { emitter, promise } = claimToken(validParameters)

    const signingError = vi.fn()
    emitter.on('user-signing-claim-token-error', signingError)

    await promise

    expect(signingError).toHaveBeenCalledExactlyOnceWith(error)
    expect(waitForTransactionReceipt).not.toHaveBeenCalled()
  })

  it('should emit "claim-token-transaction-reverted" when the transaction reverts', async function () {
    const receipt = { status: 'reverted' }
    vi.mocked(simulateContract).mockResolvedValue({ result: undefined })
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = claimToken(validParameters)

    const reverted = vi.fn()
    emitter.on('claim-token-transaction-reverted', reverted)

    await promise

    expect(reverted).toHaveBeenCalledExactlyOnceWith(receipt)
  })
  it('should report a claim cancelled in the wallet as a refused signature, not a claim', async function () {
    vi.mocked(simulateContract).mockResolvedValue({ result: BigInt(0) })
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    mockReplacement('cancelled')

    const { emitter, promise } = claimToken(validParameters)

    const signingError = vi.fn()
    const succeeded = vi.fn()
    emitter.on('user-signing-claim-token-error', signingError)
    emitter.on('claim-token-transaction-succeeded', succeeded)

    await promise

    expect(signingError).toHaveBeenCalledOnce()
    expect(succeeded).not.toHaveBeenCalled()
  })

  it('should emit "claim-token-failed" when another transaction replaced the claim', async function () {
    vi.mocked(simulateContract).mockResolvedValue({ result: BigInt(0) })
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    mockReplacement('replaced')

    const { emitter, promise } = claimToken(validParameters)

    const failed = vi.fn()
    const succeeded = vi.fn()
    emitter.on('claim-token-failed', failed)
    emitter.on('claim-token-transaction-succeeded', succeeded)

    await promise

    expect(failed).toHaveBeenCalledOnce()
    expect(succeeded).not.toHaveBeenCalled()
  })

  it('should report a repriced claim as settled, with the receipt that was mined', async function () {
    const receipt = { status: 'success', transactionHash: '0x01' }
    vi.mocked(simulateContract).mockResolvedValue({ result: BigInt(0) })
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    mockReplacement('repriced', receipt)

    const { emitter, promise } = claimToken(validParameters)

    const succeeded = vi.fn()
    emitter.on('claim-token-transaction-succeeded', succeeded)

    await promise

    expect(succeeded).toHaveBeenCalledExactlyOnceWith(receipt)
  })
})
