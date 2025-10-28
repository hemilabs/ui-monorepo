import {
  type Address,
  TransactionReceipt,
  type WalletClient,
  zeroAddress,
} from 'viem'
import { waitForTransactionReceipt, writeContract } from 'viem/actions'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  collectAllRewards,
  encodeCollectAllRewards,
} from '../../actions/wallet/collectRewards'
import { getVeHemiRewardsContractAddress } from '../../constants'
import { toPromiseEvent } from '../../utils'

vi.mock('viem/actions')
vi.mock('../../constants')
vi.mock('../../utils')

describe('collectAllRewards', function () {
  const mockAccount: Address = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
  const mockRewardToken: Address = '0x2315ab2800c25D0f932dD7f5D15CeA43cAA614Dd'
  const mockTokenId = 1n
  const mockHash: Address = '0xhash1234567890123456789012345678901234567890'

  let mockWalletClient: WalletClient
  let mockEmitter: {
    emit: ReturnType<typeof vi.fn>
    on: ReturnType<typeof vi.fn>
  }

  beforeEach(function () {
    vi.clearAllMocks()

    mockWalletClient = {
      account: { address: mockAccount },
      chain: { id: 743111 },
    } as unknown as WalletClient

    mockEmitter = {
      emit: vi.fn(),
      on: vi.fn(),
    }

    vi.mocked(getVeHemiRewardsContractAddress).mockReturnValue(
      '0x1234567890123456789012345678901234567890',
    )
    vi.mocked(toPromiseEvent).mockImplementation(fn => fn)
  })

  describe('canCollectRewards validation', function () {
    it('should fail if wallet client chain is not defined', async function () {
      const walletClientNoChain = { chain: undefined } as WalletClient

      const runFn = await collectAllRewards({
        account: mockAccount,
        rewardToken: mockRewardToken,
        tokenId: mockTokenId,
        walletClient: walletClientNoChain,
      })

      await runFn(mockEmitter)

      expect(mockEmitter.emit).toHaveBeenCalledWith(
        'collect-all-rewards-failed-validation',
        'wallet client chain is not defined',
      )
    })

    it('should fail if tokenId is 0', async function () {
      const runFn = await collectAllRewards({
        account: mockAccount,
        rewardToken: mockRewardToken,
        tokenId: 0n,
        walletClient: mockWalletClient,
      })

      await runFn(mockEmitter)

      expect(mockEmitter.emit).toHaveBeenCalledWith(
        'collect-all-rewards-failed-validation',
        'invalid token id',
      )
    })

    it('should fail if rewardToken is zero address', async function () {
      const runFn = await collectAllRewards({
        account: mockAccount,
        rewardToken: zeroAddress,
        tokenId: mockTokenId,
        walletClient: mockWalletClient,
      })

      await runFn(mockEmitter)

      expect(mockEmitter.emit).toHaveBeenCalledWith(
        'collect-all-rewards-failed-validation',
        'invalid reward token address',
      )
    })

    it('should pass validation with valid inputs', async function () {
      vi.mocked(writeContract).mockResolvedValue(mockHash)

      const runFn = await collectAllRewards({
        account: mockAccount,
        rewardToken: mockRewardToken,
        tokenId: mockTokenId,
        walletClient: mockWalletClient,
      })

      await runFn(mockEmitter)

      expect(mockEmitter.emit).toHaveBeenCalledWith('pre-collect-all-rewards')
    })
  })

  describe('collectAllRewards execution', function () {
    it('should emit pre-collect-all-rewards event', async function () {
      vi.mocked(writeContract).mockResolvedValue(mockHash)

      const runFn = await collectAllRewards({
        account: mockAccount,
        rewardToken: mockRewardToken,
        tokenId: mockTokenId,
        walletClient: mockWalletClient,
      })

      await runFn(mockEmitter)

      expect(mockEmitter.emit).toHaveBeenCalledWith('pre-collect-all-rewards')
    })

    it('should call writeContract with correct parameters', async function () {
      vi.mocked(writeContract).mockResolvedValue(mockHash)

      const runFn = await collectAllRewards({
        account: mockAccount,
        addToPositionBPS: 0n,
        rewardToken: mockRewardToken,
        tokenId: mockTokenId,
        walletClient: mockWalletClient,
      })

      await runFn(mockEmitter)

      expect(writeContract).toHaveBeenCalledWith(
        mockWalletClient,
        expect.objectContaining({
          account: mockAccount,
          args: [mockTokenId, 0n],
          functionName: 'collectAllRewards',
        }),
      )
    })

    it('should emit user-signed-collect-all-rewards with hash', async function () {
      vi.mocked(writeContract).mockResolvedValue(mockHash)
      vi.mocked(waitForTransactionReceipt).mockResolvedValue({
        status: 'success',
      } as TransactionReceipt)

      const runFn = await collectAllRewards({
        account: mockAccount,
        rewardToken: mockRewardToken,
        tokenId: mockTokenId,
        walletClient: mockWalletClient,
      })

      await runFn(mockEmitter)

      expect(mockEmitter.emit).toHaveBeenCalledWith(
        'user-signed-collect-all-rewards',
        mockHash,
      )
    })

    it('should emit user-signing-collect-all-rewards-error on signing error', async function () {
      const mockError = new Error('User rejected')
      vi.mocked(writeContract).mockRejectedValue(mockError)

      const runFn = await collectAllRewards({
        account: mockAccount,
        rewardToken: mockRewardToken,
        tokenId: mockTokenId,
        walletClient: mockWalletClient,
      })

      await runFn(mockEmitter)

      expect(mockEmitter.emit).toHaveBeenCalledWith(
        'user-signing-collect-all-rewards-error',
        mockError,
      )
    })
  })

  describe('transaction receipt handling', function () {
    it('should emit collect-all-rewards-transaction-succeeded on success', async function () {
      const mockReceipt = { status: 'success' } as { status: 'success' }

      vi.mocked(writeContract).mockResolvedValue(mockHash)
      vi.mocked(waitForTransactionReceipt).mockResolvedValue(mockReceipt)

      const runFn = await collectAllRewards({
        account: mockAccount,
        rewardToken: mockRewardToken,
        tokenId: mockTokenId,
        walletClient: mockWalletClient,
      })

      await runFn(mockEmitter)

      expect(mockEmitter.emit).toHaveBeenCalledWith(
        'collect-all-rewards-transaction-succeeded',
        mockReceipt,
      )
    })

    it('should emit collect-all-rewards-transaction-reverted on revert', async function () {
      const mockReceipt = { status: 'reverted' } as { status: 'reverted' }

      vi.mocked(writeContract).mockResolvedValue(mockHash)
      vi.mocked(waitForTransactionReceipt).mockResolvedValue(mockReceipt)

      const runFn = await collectAllRewards({
        account: mockAccount,
        rewardToken: mockRewardToken,
        tokenId: mockTokenId,
        walletClient: mockWalletClient,
      })

      await runFn(mockEmitter)

      expect(mockEmitter.emit).toHaveBeenCalledWith(
        'collect-all-rewards-transaction-reverted',
        mockReceipt,
      )
    })

    it('should emit collect-all-rewards-failed on receipt error', async function () {
      const mockError = new Error('Receipt failed')

      vi.mocked(writeContract).mockResolvedValue(mockHash)
      vi.mocked(waitForTransactionReceipt).mockRejectedValue(mockError)

      const runFn = await collectAllRewards({
        account: mockAccount,
        rewardToken: mockRewardToken,
        tokenId: mockTokenId,
        walletClient: mockWalletClient,
      })

      await runFn(mockEmitter)

      expect(mockEmitter.emit).toHaveBeenCalledWith(
        'collect-all-rewards-failed',
        mockError,
      )
    })

    it('should always emit collect-all-rewards-settled', async function () {
      vi.mocked(writeContract).mockResolvedValue(mockHash)

      const runFn = await collectAllRewards({
        account: mockAccount,
        rewardToken: mockRewardToken,
        tokenId: mockTokenId,
        walletClient: mockWalletClient,
      })

      await runFn(mockEmitter)

      expect(mockEmitter.emit).toHaveBeenCalledWith(
        'collect-all-rewards-settled',
      )
    })
  })

  describe('encodeCollectAllRewards', function () {
    it('should encode function data correctly', function () {
      const encoded = encodeCollectAllRewards({
        addToPositionBPS: 1000n,
        tokenId: 5n,
      })

      expect(encoded).toBeDefined()
      expect(typeof encoded).toBe('string')
      expect(encoded.startsWith('0x')).toBe(true)
    })

    it('should encode with zero addToPositionBPS', function () {
      const encoded = encodeCollectAllRewards({
        addToPositionBPS: 0n,
        tokenId: 1n,
      })

      expect(encoded).toBeDefined()
      expect(typeof encoded).toBe('string')
    })
  })

  describe('error handling', function () {
    it('should emit unexpected-error for unhandled exceptions', async function () {
      const unexpectedError = new Error('Unexpected error')

      vi.mocked(writeContract).mockImplementation(function () {
        throw unexpectedError
      })

      const runFn = await collectAllRewards({
        account: mockAccount,
        rewardToken: mockRewardToken,
        tokenId: mockTokenId,
        walletClient: mockWalletClient,
      })

      await runFn(mockEmitter)

      expect(mockEmitter.emit).toHaveBeenCalledWith(
        'unexpected-error',
        unexpectedError,
      )
      expect(mockEmitter.emit).toHaveBeenCalledWith(
        'collect-all-rewards-settled',
      )
    })
  })
})
