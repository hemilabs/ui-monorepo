import { zeroHash } from 'viem'
import {
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from 'viem/actions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { captureAndWithdraw } from '../../../actions'
import * as constants from '../../../constants'

vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
  simulateContract: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}))

const mockRewardsAddress = '0x1234567890123456789012345678901234567890'

const validParameters = {
  account: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as const,
  tokenId: BigInt(1),
  veHemiAddress: '0x9999999999999999999999999999999999999999' as const,
  walletClient: { chain: { id: 743111 } },
}

// Every capture starts by asking which veHEMI the rewards contract tracks.
const mockBoundVeHemi = (address: string) =>
  vi.mocked(readContract).mockResolvedValueOnce(address)

const mockPositionClass = (captured: boolean[]) =>
  captured.forEach(value =>
    vi.mocked(readContract).mockResolvedValueOnce([BigInt(0), false, value]),
  )

describe('captureAndWithdraw', function () {
  beforeEach(function () {
    vi.spyOn(constants, 'getVeHemiEpochRewardsContractAddress').mockReturnValue(
      mockRewardsAddress,
    )
  })

  it('should emit "withdraw-failed-validation" if the wallet client has no chain', async function () {
    const { emitter, promise } = captureAndWithdraw({
      ...validParameters,
      walletClient: {},
    })

    const failedValidation = vi.fn()
    emitter.on('withdraw-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'wallet client chain is not defined',
    )
    expect(readContract).not.toHaveBeenCalled()
  })

  it('should burn without capturing when the class is captured already', async function () {
    mockBoundVeHemi(validParameters.veHemiAddress)
    mockPositionClass([true])
    vi.mocked(simulateContract).mockResolvedValue({ result: undefined })
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'success',
    })

    const { emitter, promise } = captureAndWithdraw(validParameters)

    const succeeded = vi.fn()
    emitter.on('withdraw-transaction-succeeded', succeeded)

    await promise

    expect(writeContract).toHaveBeenCalledExactlyOnceWith(
      validParameters.walletClient,
      expect.objectContaining({
        address: validParameters.veHemiAddress,
        functionName: 'withdraw',
      }),
    )
    expect(succeeded).toHaveBeenCalledOnce()
  })

  it('should capture the class and then burn', async function () {
    mockBoundVeHemi(validParameters.veHemiAddress)
    mockPositionClass([false, true])
    vi.mocked(simulateContract).mockResolvedValue({ result: true })
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'success',
    })

    const { emitter, promise } = captureAndWithdraw(validParameters)

    const succeeded = vi.fn()
    emitter.on('withdraw-transaction-succeeded', succeeded)

    await promise

    expect(writeContract).toHaveBeenCalledTimes(2)
    expect(writeContract).toHaveBeenNthCalledWith(
      1,
      validParameters.walletClient,
      expect.objectContaining({
        address: mockRewardsAddress,
        functionName: 'capturePositionClass',
      }),
    )
    expect(succeeded).toHaveBeenCalledOnce()
  })

  it('should refuse the burn when the class cannot be captured', async function () {
    mockBoundVeHemi(validParameters.veHemiAddress)
    mockPositionClass([false])
    vi.mocked(simulateContract).mockResolvedValue({ result: false })

    const { emitter, promise } = captureAndWithdraw(validParameters)

    const failedValidation = vi.fn()
    emitter.on('withdraw-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'the position class cannot be captured',
    )
    expect(writeContract).not.toHaveBeenCalled()
  })

  it('should refuse the burn when the capture transaction reverts', async function () {
    mockBoundVeHemi(validParameters.veHemiAddress)
    mockPositionClass([false])
    vi.mocked(simulateContract).mockResolvedValue({ result: true })
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'reverted',
    })

    const { emitter, promise } = captureAndWithdraw(validParameters)

    const failedValidation = vi.fn()
    emitter.on('withdraw-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'capturing the position class was reverted',
    )
    expect(writeContract).toHaveBeenCalledOnce()
  })

  it('should refuse the burn when the capture did not land', async function () {
    mockBoundVeHemi(validParameters.veHemiAddress)
    mockPositionClass([false, false])
    vi.mocked(simulateContract).mockResolvedValue({ result: true })
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'success',
    })

    const { emitter, promise } = captureAndWithdraw(validParameters)

    const failedValidation = vi.fn()
    emitter.on('withdraw-failed-validation', failedValidation)

    await promise

    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'the position class was not captured',
    )
    expect(writeContract).toHaveBeenCalledOnce()
  })

  it('should report the capture transaction as its own step', async function () {
    mockBoundVeHemi(validParameters.veHemiAddress)
    mockPositionClass([false, true])
    vi.mocked(simulateContract).mockResolvedValue({ result: true })
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'success',
    })

    const { emitter, promise } = captureAndWithdraw(validParameters)

    const preCapture = vi.fn()
    const signed = vi.fn()
    const captureSucceeded = vi.fn()
    emitter.on('pre-capture', preCapture)
    emitter.on('user-signed-capture', signed)
    emitter.on('capture-transaction-succeeded', captureSucceeded)

    await promise

    expect(preCapture).toHaveBeenCalledOnce()
    expect(signed).toHaveBeenCalledExactlyOnceWith(zeroHash)
    expect(captureSucceeded).toHaveBeenCalledOnce()
  })

  it('should emit "capture-not-needed" when the class is captured already', async function () {
    mockBoundVeHemi(validParameters.veHemiAddress)
    mockPositionClass([true])
    vi.mocked(simulateContract).mockResolvedValue({ result: undefined })
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'success',
    })

    const { emitter, promise } = captureAndWithdraw(validParameters)

    const notNeeded = vi.fn()
    const preCapture = vi.fn()
    emitter.on('capture-not-needed', notNeeded)
    emitter.on('pre-capture', preCapture)

    await promise

    expect(notNeeded).toHaveBeenCalledOnce()
    expect(preCapture).not.toHaveBeenCalled()
  })

  it('should refuse the burn when the capture is not signed', async function () {
    const error = new Error('user rejected the request')
    mockBoundVeHemi(validParameters.veHemiAddress)
    mockPositionClass([false])
    vi.mocked(simulateContract).mockResolvedValue({ result: true })
    vi.mocked(writeContract).mockRejectedValue(error)

    const { emitter, promise } = captureAndWithdraw(validParameters)

    const signingError = vi.fn()
    const failedValidation = vi.fn()
    emitter.on('user-signing-capture-error', signingError)
    emitter.on('withdraw-failed-validation', failedValidation)

    await promise

    expect(signingError).toHaveBeenCalledExactlyOnceWith(error)
    expect(failedValidation).toHaveBeenCalledExactlyOnceWith(
      'the position class capture was not signed',
    )
  })

  it('should burn without capturing when the rewards contract tracks another veHEMI', async function () {
    mockBoundVeHemi('0x1111111111111111111111111111111111111111')
    vi.mocked(simulateContract).mockResolvedValue({ result: undefined })
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue({
      status: 'success',
    })

    const { emitter, promise } = captureAndWithdraw(validParameters)

    const succeeded = vi.fn()
    emitter.on('withdraw-transaction-succeeded', succeeded)

    await promise

    expect(readContract).toHaveBeenCalledOnce()
    expect(writeContract).toHaveBeenCalledExactlyOnceWith(
      validParameters.walletClient,
      expect.objectContaining({
        address: validParameters.veHemiAddress,
        functionName: 'withdraw',
      }),
    )
    expect(succeeded).toHaveBeenCalledOnce()
  })

  it('should emit "withdraw-failed" and never sign when the burn simulation reverts', async function () {
    const error = new Error('lock not yet expired')
    mockBoundVeHemi(validParameters.veHemiAddress)
    mockPositionClass([true])
    vi.mocked(simulateContract).mockRejectedValue(error)

    const { emitter, promise } = captureAndWithdraw(validParameters)

    const failed = vi.fn()
    const preWithdraw = vi.fn()
    emitter.on('withdraw-failed', failed)
    emitter.on('pre-withdraw', preWithdraw)

    await promise

    expect(failed).toHaveBeenCalledExactlyOnceWith(error)
    expect(preWithdraw).not.toHaveBeenCalled()
    expect(writeContract).not.toHaveBeenCalled()
  })
})
