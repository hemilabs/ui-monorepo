import { type TransactionReceipt, type WalletClient, zeroHash } from 'viem'
import {
  getBalance,
  waitForTransactionReceipt,
  writeContract,
} from 'viem/actions'
import { hemiSepolia } from 'viem/chains'
import { describe, expect, it, vi } from 'vitest'

import { claimReward } from '../../../src/actions/wallet/claimReward'

vi.mock('viem/actions', () => ({
  getBalance: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  writeContract: vi.fn(),
}))

const accountAddress = '0x0000000000000000000000000000000000000999'
const mockWalletClient = {
  account: { address: accountAddress },
  chain: hemiSepolia,
} as unknown as WalletClient

const validParameters = {
  account: accountAddress,
  vaultRewardsAddress: '0x0000000000000000000000000000000000000111',
  walletClient: mockWalletClient,
}

describe('claimReward', function () {
  it('should emit "unexpected-error" if wallet client chain is not defined', async function () {
    const walletClientWithoutChain = {} as WalletClient

    const { emitter, promise } = claimReward({
      ...validParameters,
      walletClient: walletClientWithoutChain,
    })

    const onUnexpectedError = vi.fn()
    const onSettled = vi.fn()
    emitter.on('unexpected-error', onUnexpectedError)
    emitter.on('claim-reward-settled', onSettled)

    await promise

    expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(expect.any(Error))
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "unexpected-error" if wallet client account is not defined', async function () {
    const walletClientWithoutAccount = {
      chain: hemiSepolia,
    } as WalletClient

    const { emitter, promise } = claimReward({
      ...validParameters,
      walletClient: walletClientWithoutAccount,
    })

    const onUnexpectedError = vi.fn()
    const onSettled = vi.fn()
    emitter.on('unexpected-error', onUnexpectedError)
    emitter.on('claim-reward-settled', onSettled)

    await promise

    expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(expect.any(Error))
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "claim-reward-failed-validation" if vaultRewardsAddress is invalid', async function () {
    const { emitter, promise } = claimReward({
      ...validParameters,
      // @ts-expect-error Testing invalid type
      vaultRewardsAddress: 'invalid-address',
    })

    const claimRewardFailedValidation = vi.fn()
    emitter.on('claim-reward-failed-validation', claimRewardFailedValidation)

    await promise

    expect(claimRewardFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'invalid contract address provided',
    )
  })

  it('should emit "claim-reward-failed-validation" if account has insufficient balance', async function () {
    vi.mocked(getBalance).mockResolvedValue(BigInt(0))

    const { emitter, promise } = claimReward(validParameters)

    const claimRewardFailedValidation = vi.fn()
    emitter.on('claim-reward-failed-validation', claimRewardFailedValidation)

    await promise

    expect(claimRewardFailedValidation).toHaveBeenCalledExactlyOnceWith(
      'insufficient native token balance for gas fees',
    )
  })

  it('should emit "claim-reward-transaction-succeeded" when claim succeeds', async function () {
    const receipt = {
      status: 'success',
    } as TransactionReceipt

    vi.mocked(getBalance).mockResolvedValue(BigInt('1000000000000'))
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = claimReward(validParameters)

    const onPreClaimReward = vi.fn()
    const onUserSignedClaimReward = vi.fn()
    const onClaimRewardTransactionSucceeded = vi.fn()
    const onClaimRewardTransactionReverted = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-claim-reward', onPreClaimReward)
    emitter.on('user-signed-claim-reward', onUserSignedClaimReward)
    emitter.on(
      'claim-reward-transaction-succeeded',
      onClaimRewardTransactionSucceeded,
    )
    emitter.on(
      'claim-reward-transaction-reverted',
      onClaimRewardTransactionReverted,
    )
    emitter.on('claim-reward-settled', onSettled)

    await promise

    expect(onPreClaimReward).toHaveBeenCalledOnce()
    expect(onUserSignedClaimReward).toHaveBeenCalledExactlyOnceWith(zeroHash)
    expect(onClaimRewardTransactionSucceeded).toHaveBeenCalledExactlyOnceWith(
      receipt,
    )
    expect(onClaimRewardTransactionReverted).not.toHaveBeenCalled()
    expect(writeContract).toHaveBeenCalledExactlyOnceWith(
      validParameters.walletClient,
      expect.objectContaining({
        account: validParameters.account,
        address: validParameters.vaultRewardsAddress,
        args: [validParameters.account],
        chain: validParameters.walletClient.chain,
        functionName: 'claimReward',
      }),
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "user-signing-claim-reward-error" when claim signing fails', async function () {
    vi.mocked(getBalance).mockResolvedValue(BigInt('1000000000000'))
    vi.mocked(writeContract).mockRejectedValue(new Error('Claim signing error'))

    const { emitter, promise } = claimReward(validParameters)

    const onPreClaimReward = vi.fn()
    const onUserSigningClaimRewardError = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-claim-reward', onPreClaimReward)
    emitter.on('user-signing-claim-reward-error', onUserSigningClaimRewardError)
    emitter.on('claim-reward-settled', onSettled)

    await promise

    expect(onPreClaimReward).toHaveBeenCalledOnce()
    expect(onUserSigningClaimRewardError).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "claim-reward-failed" when claim receipt fails', async function () {
    vi.mocked(getBalance).mockResolvedValue(BigInt('1000000000000'))
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockRejectedValue(
      new Error('Receipt error'),
    )

    const { emitter, promise } = claimReward(validParameters)

    const onPreClaimReward = vi.fn()
    const onUserSignedClaimReward = vi.fn()
    const onClaimRewardFailed = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-claim-reward', onPreClaimReward)
    emitter.on('user-signed-claim-reward', onUserSignedClaimReward)
    emitter.on('claim-reward-failed', onClaimRewardFailed)
    emitter.on('claim-reward-settled', onSettled)

    await promise

    expect(onPreClaimReward).toHaveBeenCalledOnce()
    expect(onUserSignedClaimReward).toHaveBeenCalledExactlyOnceWith(zeroHash)
    expect(onClaimRewardFailed).toHaveBeenCalledExactlyOnceWith(
      expect.any(Error),
    )
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "claim-reward-transaction-reverted" when claim transaction reverts', async function () {
    const receipt = {
      status: 'reverted',
    } as TransactionReceipt

    vi.mocked(getBalance).mockResolvedValue(BigInt('1000000000000'))
    vi.mocked(writeContract).mockResolvedValue(zeroHash)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(receipt)

    const { emitter, promise } = claimReward(validParameters)

    const onPreClaimReward = vi.fn()
    const onUserSignedClaimReward = vi.fn()
    const onClaimRewardTransactionReverted = vi.fn()
    const onClaimRewardTransactionSucceeded = vi.fn()
    const onSettled = vi.fn()

    emitter.on('pre-claim-reward', onPreClaimReward)
    emitter.on('user-signed-claim-reward', onUserSignedClaimReward)
    emitter.on(
      'claim-reward-transaction-reverted',
      onClaimRewardTransactionReverted,
    )
    emitter.on(
      'claim-reward-transaction-succeeded',
      onClaimRewardTransactionSucceeded,
    )
    emitter.on('claim-reward-settled', onSettled)

    await promise

    expect(onPreClaimReward).toHaveBeenCalledOnce()
    expect(onUserSignedClaimReward).toHaveBeenCalledExactlyOnceWith(zeroHash)
    expect(onClaimRewardTransactionReverted).toHaveBeenCalledExactlyOnceWith(
      receipt,
    )
    expect(onClaimRewardTransactionSucceeded).not.toHaveBeenCalled()
    expect(onSettled).toHaveBeenCalledOnce()
  })

  it('should emit "unexpected-error" when an unexpected error occurs', async function () {
    vi.mocked(getBalance).mockResolvedValue(BigInt('1000000000000'))
    // Mock a scenario that would trigger the catch block with a non-validation error
    vi.mocked(writeContract).mockImplementation(function () {
      throw new Error('Unexpected error')
    })

    const { emitter, promise } = claimReward(validParameters)

    const onUnexpectedError = vi.fn()
    const onSettled = vi.fn()

    emitter.on('unexpected-error', onUnexpectedError)
    emitter.on('claim-reward-settled', onSettled)

    await promise

    expect(onUnexpectedError).toHaveBeenCalledExactlyOnceWith(expect.any(Error))
    expect(onSettled).toHaveBeenCalledOnce()
  })
})
