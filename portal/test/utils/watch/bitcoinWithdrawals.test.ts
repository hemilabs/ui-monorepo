import { bitcoinTestnet } from 'btc-wallet/chains'
import { hemiSepolia } from 'hemi-viem'
import { type ToBtcWithdrawOperation, BtcWithdrawStatus } from 'types/tunnel'
import { getEvmBlock, getEvmTransactionReceipt } from 'utils/evmApi'
import {
  getBitcoinWithdrawalUuid,
  getHemiStatusOfBtcWithdrawal,
} from 'utils/hemi'
import { watchBitcoinWithdrawal } from 'utils/watch/bitcoinWithdrawals'
import { describe, expect, it, vi } from 'vitest'

const withdrawal: ToBtcWithdrawOperation = {
  amount: '100000000',
  l1ChainId: bitcoinTestnet.id,
  l2ChainId: hemiSepolia.id,
  status: BtcWithdrawStatus.INITIATE_WITHDRAW_PENDING,
  transactionHash: '0x0000000000000000000000000000000000000002',
}

const withdrawalReceipt = {
  blockNumber: BigInt(123),
  transactionHash: withdrawal.transactionHash,
}

const block = {
  blockNumber: withdrawalReceipt.blockNumber,
  timestamp: BigInt(new Date().getTime()),
}

const uuid = BigInt(1)

vi.mock('utils/chainClients', () => ({
  getHemiClient: vi.fn(),
}))

vi.mock('utils/evmApi', () => ({
  getEvmBlock: vi.fn(),
  getEvmTransactionReceipt: vi.fn(),
}))

vi.mock('utils/hemi', () => ({
  getBitcoinWithdrawalUuid: vi.fn(),
  getHemiStatusOfBtcWithdrawal: vi.fn(),
}))

describe('utils/watch/bitcoinWithdrawals', function () {
  describe('watchBitcoinWithdrawal', function () {
    it('should return no changes if the withdrawal is still pending', async function () {
      vi.mocked(getHemiStatusOfBtcWithdrawal).mockResolvedValue(
        BtcWithdrawStatus.INITIATE_WITHDRAW_PENDING,
      )

      const updates = await watchBitcoinWithdrawal(withdrawal)

      expect(updates).toEqual({})
    })

    it('should update the status and add new fields if status changes to confirmed', async function () {
      vi.mocked(getHemiStatusOfBtcWithdrawal).mockResolvedValue(
        BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED,
      )
      vi.mocked(getEvmTransactionReceipt).mockResolvedValue(withdrawalReceipt)
      vi.mocked(getBitcoinWithdrawalUuid).mockReturnValue(uuid)
      vi.mocked(getEvmBlock).mockResolvedValue(block)

      const updates = await watchBitcoinWithdrawal(withdrawal)

      expect(updates).toEqual({
        blockNumber: Number(block.blockNumber),
        status: BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED,
        timestamp: Number(block.timestamp),
        uuid: uuid.toString(),
      })

      expect(getEvmTransactionReceipt).toHaveBeenCalledExactlyOnceWith(
        withdrawal.transactionHash,
        withdrawal.l2ChainId,
      )

      expect(getBitcoinWithdrawalUuid).toHaveBeenCalledOnce()

      expect(getEvmBlock).toHaveBeenCalledExactlyOnceWith(
        withdrawalReceipt.blockNumber,
        withdrawal.l2ChainId,
      )
    })

    it('should add missing data if the withdrawal was already confirmed', async function () {
      vi.mocked(getHemiStatusOfBtcWithdrawal).mockResolvedValue(
        BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED,
      )
      vi.mocked(getEvmTransactionReceipt).mockResolvedValue({
        ...withdrawalReceipt,
        status: BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED,
      })
      vi.mocked(getBitcoinWithdrawalUuid).mockReturnValue(uuid)
      vi.mocked(getEvmBlock).mockResolvedValue(block)

      const updates = await watchBitcoinWithdrawal({
        ...withdrawal,
        status: BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED,
      })

      expect(updates).toEqual({
        blockNumber: Number(block.blockNumber),
        timestamp: Number(block.timestamp),
        uuid: uuid.toString(),
      })

      expect(getEvmTransactionReceipt).toHaveBeenCalledExactlyOnceWith(
        withdrawal.transactionHash,
        withdrawal.l2ChainId,
      )

      expect(getBitcoinWithdrawalUuid).toHaveBeenCalledOnce()

      expect(getEvmBlock).toHaveBeenCalledExactlyOnceWith(
        withdrawalReceipt.blockNumber,
        withdrawal.l2ChainId,
      )
    })

    it('should not return any changes if there are no changes', async function () {
      vi.mocked(getHemiStatusOfBtcWithdrawal).mockResolvedValue(
        BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED,
      )
      vi.mocked(getEvmTransactionReceipt).mockResolvedValue({
        ...withdrawalReceipt,
        status: BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED,
      })
      vi.mocked(getBitcoinWithdrawalUuid).mockReturnValue(uuid)
      vi.mocked(getEvmBlock).mockResolvedValue(block)

      const updates = await watchBitcoinWithdrawal({
        ...withdrawal,
        blockNumber: Number(block.blockNumber),
        status: BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED,
        timestamp: Number(block.timestamp),
        uuid: uuid.toString(),
      })

      expect(updates).toEqual({})

      expect(getBitcoinWithdrawalUuid).not.toHaveBeenCalled()
      expect(getEvmBlock).not.toHaveBeenCalled()
    })
  })
})
