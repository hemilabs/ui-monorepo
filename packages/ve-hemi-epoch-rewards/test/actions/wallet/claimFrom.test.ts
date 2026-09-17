import { decodeFunctionData, getAddress, zeroAddress, zeroHash } from 'viem'
import {
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from 'viem/actions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { claimFrom, encodeClaimFrom } from '../../../actions'
import * as constants from '../../../constants'
import { veHemiEpochRewardsAbi } from '../../../rewardsAbi'

vi.mock('viem/actions', () => ({
  simulateContract: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}))

const mockRewardsAddress = '0x1234567890123456789012345678901234567890'
const chain = { id: 743111 }

const validParameters = {
  account: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as const,
  fromEpoch: 100,
  toEpoch: 119,
  tokenId: BigInt(1),
  tokenStart: BigInt(0),
  walletClient: { chain },
}

describe('claimFrom', function () {
  beforeEach(function () {
    vi.spyOn(constants, 'getVeHemiEpochRewardsContractAddress').mockReturnValue(
      mockRewardsAddress,
    )
  })

  it('should emit "claim-from-failed-validation" if the wallet client has no chain', async function () {
    const { emitter, promise } = claimFrom({
      ...validParameters,
      walletClient: { chain: undefined },
    })

    const failedValidation = vi.fn()
    emitter.on('claim-from-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'wallet client chain is not defined',
    )
    expect(simulateContract).not.toHaveBeenCalled()
  })

  it('should emit "claim-from-failed-validation" if the account is the zero address', async function () {
    const { emitter, promise } = claimFrom({
      ...validParameters,
      account: zeroAddress,
    })

    const failedValidation = vi.fn()
    emitter.on('claim-from-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'account is not a valid address',
    )
  })

  it('should emit "claim-from-failed-validation" if the tokenStart is negative', async function () {
    const { emitter, promise } = claimFrom({
      ...validParameters,
      tokenStart: BigInt(-1),
    })

    const failedValidation = vi.fn()
    emitter.on('claim-from-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'tokenStart is not valid',
    )
  })

  it('should simulate the call and send it when the registry is exhausted', async function () {
    const receipt = { status: 'success' }
    vi.mocked(simulateContract).mockResolvedValue({ result: BigInt(0) })
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = claimFrom(validParameters)

    const succeeded = vi.fn()
    const settled = vi.fn()
    emitter.on('claim-from-transaction-succeeded', succeeded)
    emitter.on('claim-from-settled', settled)

    await promise

    const expectedCall = {
      abi: veHemiEpochRewardsAbi,
      account: validParameters.account,
      address: mockRewardsAddress,
      args: [BigInt(1), validParameters.account, 100, 119, BigInt(0)],
      chain,
      functionName: 'claimFrom',
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

  it('should never sign when the claim would leave reward tokens unsettled', async function () {
    vi.mocked(simulateContract).mockResolvedValue({ result: BigInt(1) })

    const { emitter, promise } = claimFrom(validParameters)

    const failedValidation = vi.fn()
    emitter.on('claim-from-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'the claim would not settle every reward token',
    )
    expect(writeContract).not.toHaveBeenCalled()
  })

  it('should emit "claim-from-transaction-reverted" when the transaction reverts', async function () {
    const receipt = { status: 'reverted' }
    vi.mocked(simulateContract).mockResolvedValue({ result: BigInt(0) })
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = claimFrom(validParameters)

    const reverted = vi.fn()
    emitter.on('claim-from-transaction-reverted', reverted)

    await promise

    expect(reverted).toHaveBeenCalledExactlyOnceWith(receipt)
  })

  it('should emit "claim-from-failed" and never sign when the simulation reverts', async function () {
    const error = new Error('RangeTooWide')
    vi.mocked(simulateContract).mockRejectedValue(error)

    const { emitter, promise } = claimFrom(validParameters)

    const failed = vi.fn()
    const preClaim = vi.fn()
    emitter.on('claim-from-failed', failed)
    emitter.on('pre-claim-from', preClaim)

    await promise

    expect(failed).toHaveBeenCalledExactlyOnceWith(error)
    expect(preClaim).not.toHaveBeenCalled()
    expect(writeContract).not.toHaveBeenCalled()
  })

  it('should emit "user-signing-claim-from-error" when the user rejects', async function () {
    const error = new Error('user rejected')
    vi.mocked(simulateContract).mockResolvedValue({ result: BigInt(0) })
    vi.mocked(writeContract).mockRejectedValue(error)

    const { emitter, promise } = claimFrom(validParameters)

    const signingError = vi.fn()
    emitter.on('user-signing-claim-from-error', signingError)

    await promise

    expect(signingError).toHaveBeenCalledExactlyOnceWith(error)
    expect(waitForTransactionReceipt).not.toHaveBeenCalled()
  })
})

describe('encodeClaimFrom', function () {
  it('should encode a claimFrom call that decodes back to the same arguments', function () {
    const data = encodeClaimFrom({
      account: validParameters.account,
      fromEpoch: 100,
      toEpoch: 119,
      tokenId: BigInt(1),
      tokenStart: BigInt(8),
    })

    expect(decodeFunctionData({ abi: veHemiEpochRewardsAbi, data })).toEqual({
      args: [
        BigInt(1),
        getAddress(validParameters.account),
        100,
        119,
        BigInt(8),
      ],
      functionName: 'claimFrom',
    })
  })
})
