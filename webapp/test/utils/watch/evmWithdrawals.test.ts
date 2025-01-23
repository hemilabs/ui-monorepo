import { MessageDirection, MessageStatus } from '@eth-optimism/sdk'
import { hemiSepolia } from 'hemi-viem'
import { ToEvmWithdrawOperation } from 'types/tunnel'
import { createQueuedCrossChainMessenger } from 'utils/crossChainMessenger'
import { getEvmBlock, getEvmTransactionReceipt } from 'utils/evmApi'
import { createProvider } from 'utils/providers'
import { sepolia } from 'viem/chains'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// @ts-expect-error Only adding the minimum required properties
const withdrawal: ToEvmWithdrawOperation = {
  direction: MessageDirection.L2_TO_L1,
  l1ChainId: sepolia.id,
  l2ChainId: hemiSepolia.id,
  transactionHash: '0x0000000000000000000000000000000000000004',
}

vi.mock('utils/crossChainMessenger', () => ({
  createQueuedCrossChainMessenger: vi.fn(),
}))

vi.mock('utils/evmApi', () => ({
  getEvmBlock: vi.fn(),
  getEvmTransactionReceipt: vi.fn(),
}))

vi.mock('utils/providers', () => ({
  createProvider: vi.fn(),
}))

describe('utils/watch/evmWithdrawals', function () {
  beforeEach(function () {
    vi.clearAllMocks()
    vi.resetAllMocks()
    vi.resetModules()
  })

  describe('watchEvmWithdrawal', async function () {
    it('should return no changes if the withdrawal is pending', async function () {
      const { watchEvmWithdrawal } = await import('utils/watch/evmWithdrawals')
      vi.mocked(createQueuedCrossChainMessenger).mockResolvedValue({})
      vi.mocked(createProvider).mockResolvedValue({})
      vi.mocked(getEvmTransactionReceipt).mockResolvedValue(null)

      const updates = await watchEvmWithdrawal(withdrawal)

      expect(updates).toEqual({})
    })

    it('should return the updated fields with the new values', async function () {
      const { watchEvmWithdrawal } = await import('utils/watch/evmWithdrawals')
      const blockNumber = BigInt(123)
      const newStatus = MessageStatus.READY_TO_PROVE
      const timestamp = BigInt(new Date().getTime())
      const getMessageStatus = vi.fn().mockResolvedValue(newStatus)
      vi.mocked(createQueuedCrossChainMessenger).mockResolvedValue({
        getMessageStatus,
      })
      vi.mocked(getEvmBlock).mockResolvedValue({ timestamp })
      vi.mocked(getEvmTransactionReceipt).mockResolvedValue({
        blockNumber,
      })

      const updates = await watchEvmWithdrawal({
        ...withdrawal,
        status: MessageStatus.STATE_ROOT_NOT_PUBLISHED,
      })

      expect(updates).toEqual({
        blockNumber: Number(blockNumber),
        status: newStatus,
        timestamp: Number(timestamp),
      })
      expect(getMessageStatus).toHaveBeenCalledOnce()
      expect(getMessageStatus).toHaveBeenCalledWith(
        withdrawal.transactionHash,
        0,
        withdrawal.direction,
      )
    })

    it('should return no updates if the withdrawal has not changed', async function () {
      const newWithdrawal: ToEvmWithdrawOperation = {
        ...withdrawal,
        blockNumber: 789,
        timestamp: new Date().getTime(),
      }
      const { watchEvmWithdrawal } = await import('utils/watch/evmWithdrawals')
      vi.mocked(createQueuedCrossChainMessenger).mockResolvedValue({
        getMessageStatus: vi.fn().mockResolvedValue(newWithdrawal.status),
      })
      vi.mocked(getEvmBlock).mockResolvedValue({
        timestamp: BigInt(newWithdrawal.timestamp),
      })
      vi.mocked(getEvmTransactionReceipt).mockResolvedValue({
        blockNumber: BigInt(newWithdrawal.blockNumber),
      })

      const updates = await watchEvmWithdrawal(newWithdrawal)

      expect(updates).toEqual({})
    })
  })
})
