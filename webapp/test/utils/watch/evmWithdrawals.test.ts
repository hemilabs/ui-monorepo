import { hemiSepolia } from 'hemi-viem'
import {
  MessageDirection,
  MessageStatus,
  ToEvmWithdrawOperation,
} from 'types/tunnel'
import { getEvmBlock, getEvmTransactionReceipt } from 'utils/evmApi'
import { getEvmWithdrawalStatus } from 'utils/tunnel'
import { sepolia } from 'viem/chains'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// @ts-expect-error Only adding the minimum required properties
const withdrawal: ToEvmWithdrawOperation = {
  direction: MessageDirection.L2_TO_L1,
  l1ChainId: sepolia.id,
  l2ChainId: hemiSepolia.id,
  transactionHash: '0x0000000000000000000000000000000000000004',
}

vi.mock('utils/evmApi', () => ({
  getEvmBlock: vi.fn(),
  getEvmTransactionReceipt: vi.fn(),
}))

vi.mock('utils/tunnel', () => ({
  getEvmWithdrawalStatus: vi.fn(),
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
      vi.mocked(getEvmTransactionReceipt).mockResolvedValue(null)

      const updates = await watchEvmWithdrawal(withdrawal)

      expect(updates).toEqual({})
    })

    it('should return the updated fields with the new values', async function () {
      const { watchEvmWithdrawal } = await import('utils/watch/evmWithdrawals')
      const blockNumber = BigInt(123)
      const newStatus = MessageStatus.READY_TO_PROVE
      const timestamp = BigInt(new Date().getTime())
      vi.mocked(getEvmWithdrawalStatus).mockResolvedValue(newStatus)
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
      expect(getEvmWithdrawalStatus).toHaveBeenCalledOnce()
    })

    it('should return no updates if the withdrawal has not changed', async function () {
      const newWithdrawal: ToEvmWithdrawOperation = {
        ...withdrawal,
        blockNumber: 789,
        timestamp: new Date().getTime(),
      }
      const { watchEvmWithdrawal } = await import('utils/watch/evmWithdrawals')
      vi.mocked(getEvmWithdrawalStatus).mockResolvedValue(newWithdrawal.status)
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
