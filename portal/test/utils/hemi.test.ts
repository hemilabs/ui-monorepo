import { hemiSepolia } from 'hemi-viem'
import { HemiPublicClient } from 'hooks/useHemiClient'
import {
  BtcDepositOperation,
  BtcDepositStatus,
  BtcWithdrawStatus,
  ToBtcWithdrawOperation,
} from 'types/tunnel'
import {
  getHemiStatusOfBtcDeposit,
  getHemiStatusOfBtcWithdrawal,
} from 'utils/hemi'
import { zeroAddress } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const hemiClient: HemiPublicClient = {
  acknowledgedDeposits: vi.fn(),
  chain: hemiSepolia,
  getBitcoinKitAddress: vi
    .fn()
    .mockResolvedValue('0x0000000000000000000000000000000000000123'),
  getBitcoinVaultStateAddress: vi.fn().mockResolvedValue(zeroAddress),
  getBitcoinWithdrawalGracePeriod: vi.fn(),
  getTransactionByTxId: vi.fn(),
  getTransactionReceipt: vi.fn(),
  getTxConfirmations: vi.fn(),
  getVaultByIndex: vi.fn(),
  getVaultChildIndex: vi.fn(),
  isBitcoinWithdrawalChallenged: vi.fn(),
  isBitcoinWithdrawalFulfilled: vi.fn(),
}

const deposit: Omit<BtcDepositOperation, 'status'> = {}

const withdrawal: ToBtcWithdrawOperation = {
  l2ChainId: hemiSepolia.id,
  status: BtcWithdrawStatus.INITIATE_WITHDRAW_PENDING,
  timestamp: Math.floor(new Date().getTime() / 1000) - 3600 * 24, // 1 day hour ago
  transactionHash: '0x0000000000000000000000000000000000000003',
  uuid: '1',
}

describe('utils/hemi', function () {
  beforeEach(function () {
    vi.clearAllMocks()
  })

  describe('getHemiStatusOfBtcDeposit', function () {
    it(`should return ${BtcDepositStatus.BTC_TX_CONFIRMED} if Hemi is not aware of the bitcoin transaction`, async function () {
      hemiClient.acknowledgedDeposits.mockResolvedValue(false)
      hemiClient.getTransactionByTxId.mockRejectedValue(undefined)
      hemiClient.getTxConfirmations.mockRejectedValue(undefined)

      const newStatus = await getHemiStatusOfBtcDeposit({
        deposit,
        hemiClient,
        vaultAddress: zeroAddress,
      })

      expect(newStatus).toBe(BtcDepositStatus.BTC_TX_CONFIRMED)
    })

    it(`should return ${BtcDepositStatus.BTC_DEPOSITED} if Hemi is aware of the bitcoin transaction and the deposit is marked as acknowledged`, async function () {
      hemiClient.acknowledgedDeposits.mockResolvedValue(true)
      hemiClient.getTransactionByTxId.mockResolvedValue({ found: true })
      hemiClient.getTxConfirmations.mockResolvedValue(9)

      const newStatus = await getHemiStatusOfBtcDeposit({
        deposit,
        hemiClient,
        vaultAddress: zeroAddress,
      })

      expect(newStatus).toBe(BtcDepositStatus.BTC_DEPOSITED)
    })

    it(`should return ${BtcDepositStatus.READY_TO_MANUAL_CONFIRM} if the deposit has more than 6 confirmations and it hasn't been acknowledged`, async function () {
      hemiClient.acknowledgedDeposits.mockResolvedValue(false)
      hemiClient.getTransactionByTxId.mockResolvedValue({ found: true })
      hemiClient.getTxConfirmations.mockResolvedValue(7)

      const newStatus = await getHemiStatusOfBtcDeposit({
        deposit,
        hemiClient,
        vaultAddress: zeroAddress,
      })

      expect(newStatus).toBe(BtcDepositStatus.READY_TO_MANUAL_CONFIRM)
    })

    it(`should return ${BtcDepositStatus.BTC_TX_CONFIRMED} if the deposit does not have enough confirmations`, async function () {
      hemiClient.acknowledgedDeposits.mockResolvedValue(false)
      hemiClient.getTransactionByTxId.mockResolvedValue({ found: true })
      hemiClient.getTxConfirmations.mockResolvedValue(5)

      const newStatus = await getHemiStatusOfBtcDeposit({
        deposit,
        hemiClient,
        vaultAddress: zeroAddress,
      })

      expect(newStatus).toBe(BtcDepositStatus.BTC_TX_CONFIRMED)
    })
  })

  describe('getHemiStatusOfBtcWithdrawal', function () {
    it(`should return ${BtcWithdrawStatus.INITIATE_WITHDRAW_PENDING} if the transaction receipt is not found`, async function () {
      hemiClient.getTransactionReceipt.mockResolvedValue(null)

      const status = await getHemiStatusOfBtcWithdrawal({
        hemiClient,
        withdrawal,
      })

      expect(status).toBe(BtcWithdrawStatus.INITIATE_WITHDRAW_PENDING)
    })

    it(`should return ${BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED} if the transaction receipt is found and successful`, async function () {
      hemiClient.getTransactionReceipt.mockResolvedValue({
        status: 'success',
      })

      const status = await getHemiStatusOfBtcWithdrawal({
        hemiClient,
        withdrawal,
      })

      expect(status).toBe(BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED)
    })

    it(`should return ${BtcWithdrawStatus.WITHDRAWAL_FAILED} if the transaction receipt is found and failed`, async function () {
      hemiClient.getTransactionReceipt.mockResolvedValue({
        status: 'failed',
      })

      const status = await getHemiStatusOfBtcWithdrawal({
        hemiClient,
        withdrawal,
      })

      expect(status).toBe(BtcWithdrawStatus.WITHDRAWAL_FAILED)
    })

    it(`should return ${BtcWithdrawStatus.WITHDRAWAL_SUCCEEDED} if the withdrawal was fulfilled`, async function () {
      hemiClient.getVaultByIndex.mockResolvedValue(zeroAddress)
      hemiClient.getVaultChildIndex.mockResolvedValue(1)
      hemiClient.isBitcoinWithdrawalFulfilled.mockResolvedValue(true)
      hemiClient.isBitcoinWithdrawalChallenged.mockResolvedValue(false)

      const status = await getHemiStatusOfBtcWithdrawal({
        hemiClient,
        withdrawal: {
          ...withdrawal,
          status: BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED,
        },
      })

      expect(status).toBe(BtcWithdrawStatus.WITHDRAWAL_SUCCEEDED)
      expect(hemiClient.isBitcoinWithdrawalFulfilled).toHaveBeenCalledOnce()
      expect(hemiClient.isBitcoinWithdrawalFulfilled).toHaveBeenLastCalledWith({
        uuid: BigInt(withdrawal.uuid),
        vaultStateAddress: zeroAddress,
      })
    })

    it(`should return ${BtcWithdrawStatus.WITHDRAWAL_CHALLENGED} if the withdrawal has been challenged`, async function () {
      hemiClient.getVaultByIndex.mockResolvedValue(zeroAddress)
      hemiClient.getVaultChildIndex.mockResolvedValue(1)
      hemiClient.isBitcoinWithdrawalFulfilled.mockResolvedValue(false)
      hemiClient.isBitcoinWithdrawalChallenged.mockResolvedValue(true)

      const status = await getHemiStatusOfBtcWithdrawal({
        hemiClient,
        withdrawal: {
          ...withdrawal,
          status: BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED,
        },
      })

      expect(status).toBe(BtcWithdrawStatus.WITHDRAWAL_CHALLENGED)
      expect(hemiClient.isBitcoinWithdrawalChallenged).toHaveBeenCalledOnce()
      expect(hemiClient.isBitcoinWithdrawalChallenged).toHaveBeenLastCalledWith(
        {
          uuid: BigInt(withdrawal.uuid),
          vaultStateAddress: zeroAddress,
        },
      )
    })

    it(`should return ${BtcWithdrawStatus.READY_TO_CHALLENGE} if the withdrawal has not been challenged nor fulfilled, and the grace period has passed`, async function () {
      hemiClient.getVaultByIndex.mockResolvedValue(zeroAddress)
      hemiClient.getVaultChildIndex.mockResolvedValue(1)
      hemiClient.isBitcoinWithdrawalFulfilled.mockResolvedValue(false)
      hemiClient.isBitcoinWithdrawalChallenged.mockResolvedValue(false)
      hemiClient.getBitcoinWithdrawalGracePeriod.mockResolvedValue(BigInt(3600)) // 1 hour

      const status = await getHemiStatusOfBtcWithdrawal({
        hemiClient,
        withdrawal: {
          ...withdrawal,
          status: BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED,
        },
      })

      expect(status).toBe(BtcWithdrawStatus.READY_TO_CHALLENGE)
    })
  })
})
