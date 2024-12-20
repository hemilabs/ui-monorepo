import { bitcoinTestnet } from 'btc-wallet/chains'
import { hemiSepolia } from 'hemi-viem'
import { publicClientToHemiClient } from 'hooks/useHemiClient'
import { type BtcDepositOperation, BtcDepositStatus } from 'types/tunnel'
import { getTransactionReceipt } from 'utils/btcApi'
import { getHemiStatusOfBtcDeposit, getVaultAddressByDeposit } from 'utils/hemi'
import {
  watchDepositOnBitcoin,
  watchDepositOnHemi,
} from 'utils/watch/bitcoinDeposits'
import { describe, expect, it, vi, beforeEach } from 'vitest'

const vaultAddress = '0x0000000000000000000000000000000000000001' as const

const deposit: BtcDepositOperation = {
  amount: '100000000',
  l1ChainId: bitcoinTestnet.id,
  l2ChainId: hemiSepolia.id,
  status: BtcDepositStatus.TX_PENDING,
  transactionHash:
    '4cabca8f8b711c9d6946d737034545879a964c374a193ef9bb15ec966b826a01',
}

const depositOnHemi = { ...deposit, status: BtcDepositStatus.TX_CONFIRMED }

vi.mock('hooks/useHemiClient', () => ({
  publicClientToHemiClient: vi.fn(),
}))

vi.mock('utils/btcApi', () => ({
  getTransactionReceipt: vi.fn(),
}))

vi.mock('utils/hemi', () => ({
  getHemiStatusOfBtcDeposit: vi.fn(),
  getVaultAddressByDeposit: vi.fn(),
}))

describe('utils/watch/bitcoinDeposits', function () {
  beforeEach(function () {
    vi.clearAllMocks()
  })

  describe('watchDepositOnBitcoin', function () {
    it('should not return changes if the receipt show it is still not confirmed', async function () {
      vi.mocked(getTransactionReceipt).mockResolvedValue({
        status: { confirmed: false },
      })

      const updates = await watchDepositOnBitcoin(deposit)

      expect(updates).toEqual({})
      expect(getTransactionReceipt).toHaveBeenCalledOnce()
      expect(getTransactionReceipt).toHaveBeenCalledWith(
        deposit.transactionHash,
      )
    })

    it('should return the new status, timestamp and block height if the receipt shows confirmation', async function () {
      const blockHeight = 123
      const blockTime = 456
      vi.mocked(getTransactionReceipt).mockResolvedValue({
        status: { blockHeight, blockTime, confirmed: true },
      })

      const updates = await watchDepositOnBitcoin(deposit)

      expect(updates).toEqual({
        blockNumber: blockHeight,
        status: BtcDepositStatus.TX_CONFIRMED,
        timestamp: blockTime,
      })

      expect(getTransactionReceipt).toHaveBeenCalledOnce()
      expect(getTransactionReceipt).toHaveBeenCalledWith(
        deposit.transactionHash,
      )
    })
  })

  describe('watchDepositOnHemi', function () {
    it('should not return changes if the deposit is confirmed only on bitcoin and is not ready for claiming', async function () {
      const mock = {}
      vi.mocked(getHemiStatusOfBtcDeposit).mockResolvedValue(
        BtcDepositStatus.TX_CONFIRMED,
      )
      vi.mocked(getVaultAddressByDeposit).mockResolvedValue(vaultAddress)
      vi.mocked(publicClientToHemiClient).mockResolvedValue(mock)

      const updates = await watchDepositOnHemi(depositOnHemi)

      expect(updates).toEqual({})
    })

    it('should return changes if the deposit is confirmed on bitcoin and is ready for claiming', async function () {
      const mock = {}
      vi.mocked(getHemiStatusOfBtcDeposit).mockResolvedValue(
        BtcDepositStatus.BTC_READY_CLAIM,
      )
      vi.mocked(getVaultAddressByDeposit).mockResolvedValue(vaultAddress)
      vi.mocked(publicClientToHemiClient).mockResolvedValue(mock)

      const updates = await watchDepositOnHemi(depositOnHemi)

      expect(updates).toEqual({ status: BtcDepositStatus.BTC_READY_CLAIM })
    })
  })
})
