import { bitcoinTestnet } from 'btc-wallet/chains'
import { hemiSepolia } from 'hemi-viem'
import {
  type BtcDepositOperation,
  BtcDepositStatus,
  MessageDirection,
} from 'types/tunnel'
import { createBtcApi } from 'utils/btcApi'
import { getPublicClient } from 'utils/chainClients'
import { getBitcoinDepositVault, getHemiStatusOfBtcDeposit } from 'utils/hemi'
import { getBtcDepositInfo } from 'utils/subgraph'
import {
  watchDepositOnBitcoin,
  watchDepositOnHemi,
} from 'utils/watch/bitcoinDeposits'
import { type PublicClient, zeroHash } from 'viem'
import { describe, expect, it, vi } from 'vitest'

const vaultAddress = '0x0000000000000000000000000000000000000001' as const

const deposit: BtcDepositOperation = {
  amount: '100000000',
  direction: MessageDirection.L1_TO_L2,
  from: 'tb1qsender',
  grossAmount: '100000000',
  l1ChainId: bitcoinTestnet.id,
  l1Token: 'BTC',
  l2ChainId: hemiSepolia.id,
  l2Token: '0x0000000000000000000000000000000000000001',
  status: BtcDepositStatus.BTC_TX_PENDING,
  to: 'tb1qcustodyaddress',
  transactionHash:
    '4cabca8f8b711c9d6946d737034545879a964c374a193ef9bb15ec966b826a01',
}

const depositOnHemi = { ...deposit, status: BtcDepositStatus.BTC_TX_CONFIRMED }

// mock createBtcApi but keep the original mapBitcoinNetwork
vi.mock(import('utils/btcApi'), async function (importOriginal) {
  const btcApi = await importOriginal()
  return {
    ...btcApi,
    createBtcApi: vi.fn(),
  }
})

vi.mock('utils/chainClients', () => ({
  getPublicClient: vi.fn(),
}))

const hemiClient = { chain: hemiSepolia } as PublicClient

vi.mock('utils/hemi', () => ({
  getBitcoinDepositVault: vi.fn(),
  getHemiStatusOfBtcDeposit: vi.fn(),
}))

vi.mock('utils/subgraph', () => ({
  getBtcDepositInfo: vi.fn(),
}))

describe('utils/watch/bitcoinDeposits', function () {
  describe('watchDepositOnBitcoin', function () {
    it('should not return changes if the receipt show it is still not confirmed', async function () {
      const getTransactionReceipt = vi.fn().mockResolvedValue({
        status: { confirmed: false },
      })
      vi.mocked(createBtcApi).mockReturnValue({ getTransactionReceipt })

      const updates = await watchDepositOnBitcoin(deposit)

      expect(updates).toEqual({})
      expect(getTransactionReceipt).toHaveBeenCalledExactlyOnceWith(
        deposit.transactionHash,
      )
    })

    it('should return the new status, timestamp and block height if the receipt shows confirmation', async function () {
      const blockHeight = 123
      const blockTime = 456
      const getTransactionReceipt = vi.fn().mockResolvedValue({
        status: { blockHeight, blockTime, confirmed: true },
      })
      vi.mocked(createBtcApi).mockReturnValue({ getTransactionReceipt })

      const updates = await watchDepositOnBitcoin(deposit)

      expect(updates).toEqual({
        blockNumber: blockHeight,
        status: BtcDepositStatus.BTC_TX_CONFIRMED,
        timestamp: blockTime,
      })

      expect(getTransactionReceipt).toHaveBeenCalledExactlyOnceWith(
        deposit.transactionHash,
      )
    })
  })

  describe('watchDepositOnHemi', function () {
    it('should not return changes if the deposit is confirmed only on bitcoin and is not ready for confirming', async function () {
      vi.mocked(getHemiStatusOfBtcDeposit).mockResolvedValue(
        BtcDepositStatus.BTC_TX_CONFIRMED,
      )
      vi.mocked(getBitcoinDepositVault).mockResolvedValue({
        vaultAddress,
        vaultIndex: 4,
      })
      vi.mocked(getPublicClient).mockReturnValue(hemiClient)

      const updates = await watchDepositOnHemi(depositOnHemi)

      expect(updates).toEqual({})
      expect(getBitcoinDepositVault).toHaveBeenCalledWith(
        hemiClient,
        depositOnHemi.to,
      )
      expect(getHemiStatusOfBtcDeposit).toHaveBeenCalledWith({
        deposit: depositOnHemi,
        hemiClient,
        vaultAddress,
      })
    })

    it('should return changes if the deposit is confirmed on bitcoin and is ready for confirming', async function () {
      vi.mocked(getHemiStatusOfBtcDeposit).mockResolvedValue(
        BtcDepositStatus.READY_TO_MANUAL_CONFIRM,
      )
      vi.mocked(getBitcoinDepositVault).mockResolvedValue({
        vaultAddress,
        vaultIndex: 4,
      })
      vi.mocked(getPublicClient).mockReturnValue(hemiClient)

      const updates = await watchDepositOnHemi(depositOnHemi)

      expect(updates).toEqual({
        status: BtcDepositStatus.READY_TO_MANUAL_CONFIRM,
      })
    })

    it('should not call getHemiStatusOfBtcDeposit if the deposit status is not pending', async function () {
      const completedDeposit = {
        ...deposit,
        status: BtcDepositStatus.BTC_DEPOSITED,
      }
      vi.mocked(getBtcDepositInfo).mockResolvedValue(null)

      const updates = await watchDepositOnHemi(completedDeposit)

      expect(vi.mocked(getHemiStatusOfBtcDeposit)).not.toHaveBeenCalled()
      expect(vi.mocked(getBitcoinDepositVault)).not.toHaveBeenCalled()
      expect(updates.status).toBeUndefined()
    })

    it('should fetch the Hemi transaction hash from API when deposit is completed and confirmationTransactionHash is missing', async function () {
      vi.mocked(getBtcDepositInfo).mockResolvedValue({
        transactionHash: zeroHash,
      })

      const updates = await watchDepositOnHemi({
        ...deposit,
        status: BtcDepositStatus.BTC_DEPOSITED,
      })

      expect(vi.mocked(getBtcDepositInfo)).toHaveBeenCalledWith({
        chainId: deposit.l2ChainId,
        depositTxId: deposit.transactionHash,
      })
      expect(updates).toEqual({
        confirmationTransactionHash: zeroHash,
      })
    })

    it('should not update confirmationTransactionHash if deposit already has one', async function () {
      const completedDeposit = {
        ...deposit,
        confirmationTransactionHash: zeroHash,
        status: BtcDepositStatus.BTC_DEPOSITED,
      }

      const updates = await watchDepositOnHemi(completedDeposit)

      expect(vi.mocked(getBtcDepositInfo)).not.toHaveBeenCalled()
      expect(updates).toEqual({})
    })

    it('should not update confirmationTransactionHash if API returns null', async function () {
      const completedDeposit = {
        ...deposit,
        status: BtcDepositStatus.BTC_DEPOSITED,
      }

      vi.mocked(getBtcDepositInfo).mockResolvedValue(null)

      const updates = await watchDepositOnHemi(completedDeposit)

      expect(vi.mocked(getBtcDepositInfo)).toHaveBeenCalledWith({
        chainId: completedDeposit.l2ChainId,
        depositTxId: completedDeposit.transactionHash,
      })
      expect(updates).toEqual({})
    })
  })
})
