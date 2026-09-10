import { hemiSepolia } from 'hemi-viem'
import {
  acknowledgedDeposits,
  getBitcoinWithdrawalGracePeriod,
  getBitcoinVaultStateAddress,
  getTransactionByTxId,
  getTxConfirmations,
  getVaultByIndex,
  isAddressValid,
  isBitcoinWithdrawalChallenged,
  isBitcoinWithdrawalFulfilled,
} from 'hemi-viem/actions'
import {
  BtcDepositOperation,
  BtcDepositStatus,
  BtcWithdrawStatus,
  ToBtcWithdrawOperation,
} from 'types/tunnel'
import {
  getHemiStatusOfBtcDeposit,
  getHemiStatusOfBtcWithdrawal,
  isValidBtcAddress,
} from 'utils/hemi'
import { zeroAddress } from 'viem'
import { describe, expect, it, vi } from 'vitest'

// Mock the imported functions
vi.mock('hemi-viem/actions', () => ({
  acknowledgedDeposits: vi.fn(),
  getBitcoinKitAddress: vi
    .fn()
    .mockResolvedValue('0x0000000000000000000000000000000000000123'),
  getBitcoinVaultStateAddress: vi.fn(),
  getBitcoinWithdrawalGracePeriod: vi.fn().mockResolvedValue(1),
  getTransactionByTxId: vi.fn(),
  getTxConfirmations: vi.fn(),
  getVaultByIndex: vi.fn(),
  isAddressValid: vi.fn(),
  isBitcoinWithdrawalChallenged: vi.fn(),
  isBitcoinWithdrawalFulfilled: vi.fn(),
}))

vi.mocked(getBitcoinVaultStateAddress).mockResolvedValue(zeroAddress)
vi.mocked(getVaultByIndex).mockResolvedValue(zeroAddress)

const hemiClient: PublicClient = {
  chain: hemiSepolia,
  getTransactionReceipt: vi.fn(),
}

const deposit: Omit<BtcDepositOperation, 'status'> = {}

const vault = '0x0000000000000000000000000000000000000456'

const withdrawal: ToBtcWithdrawOperation = {
  l2ChainId: hemiSepolia.id,
  status: BtcWithdrawStatus.INITIATE_WITHDRAW_PENDING,
  timestamp: Math.floor(new Date().getTime() / 1000) - 3600 * 24, // 1 day hour ago
  transactionHash: '0x0000000000000000000000000000000000000003',
  uuid: '1',
  vault,
}

describe('utils/hemi', function () {
  describe('getHemiStatusOfBtcDeposit', function () {
    it(`should return ${BtcDepositStatus.BTC_TX_CONFIRMED} if Hemi is not aware of the bitcoin transaction`, async function () {
      vi.mocked(acknowledgedDeposits).mockResolvedValue(false)
      vi.mocked(getTransactionByTxId).mockRejectedValue(undefined)
      vi.mocked(getTxConfirmations).mockRejectedValue(undefined)

      const newStatus = await getHemiStatusOfBtcDeposit({
        deposit,
        hemiClient,
        vaultAddress: zeroAddress,
      })

      expect(newStatus).toBe(BtcDepositStatus.BTC_TX_CONFIRMED)
    })

    it(`should return ${BtcDepositStatus.BTC_DEPOSITED} if Hemi is aware of the bitcoin transaction and the deposit is marked as acknowledged`, async function () {
      vi.mocked(acknowledgedDeposits).mockResolvedValue(true)
      vi.mocked(getTransactionByTxId).mockResolvedValue({
        found: true,
      })
      vi.mocked(getTxConfirmations).mockResolvedValue(9)

      const newStatus = await getHemiStatusOfBtcDeposit({
        deposit,
        hemiClient,
        vaultAddress: zeroAddress,
      })

      expect(newStatus).toBe(BtcDepositStatus.BTC_DEPOSITED)
    })

    it(`should return ${BtcDepositStatus.READY_TO_MANUAL_CONFIRM} if the deposit has more than 6 confirmations and it hasn't been acknowledged`, async function () {
      vi.mocked(acknowledgedDeposits).mockResolvedValue(false)
      vi.mocked(getTransactionByTxId).mockResolvedValue({
        found: true,
      })
      vi.mocked(getTxConfirmations).mockResolvedValue(7)

      const newStatus = await getHemiStatusOfBtcDeposit({
        deposit,
        hemiClient,
        vaultAddress: zeroAddress,
      })

      expect(newStatus).toBe(BtcDepositStatus.READY_TO_MANUAL_CONFIRM)
    })

    it(`should return ${BtcDepositStatus.BTC_TX_CONFIRMED} if the deposit does not have enough confirmations`, async function () {
      vi.mocked(acknowledgedDeposits).mockResolvedValue(false)
      vi.mocked(getTransactionByTxId).mockResolvedValue({
        found: true,
      })
      vi.mocked(getTxConfirmations).mockResolvedValue(5)

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
      vi.mocked(hemiClient.getTransactionReceipt).mockResolvedValue(null)

      const status = await getHemiStatusOfBtcWithdrawal({
        hemiClient,
        withdrawal,
      })

      expect(status).toBe(BtcWithdrawStatus.INITIATE_WITHDRAW_PENDING)
    })

    it(`should return ${BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED} if the transaction receipt is found and successful`, async function () {
      vi.mocked(hemiClient.getTransactionReceipt).mockResolvedValue({
        status: 'success',
      })

      const status = await getHemiStatusOfBtcWithdrawal({
        hemiClient,
        withdrawal,
      })

      expect(status).toBe(BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED)
    })

    it(`should return ${BtcWithdrawStatus.WITHDRAWAL_FAILED} if the transaction receipt is found and failed`, async function () {
      vi.mocked(hemiClient.getTransactionReceipt).mockResolvedValue({
        status: 'failed',
      })

      const status = await getHemiStatusOfBtcWithdrawal({
        hemiClient,
        withdrawal,
      })

      expect(status).toBe(BtcWithdrawStatus.WITHDRAWAL_FAILED)
    })

    it(`should return ${BtcWithdrawStatus.WITHDRAWAL_SUCCEEDED} if the withdrawal was fulfilled`, async function () {
      vi.mocked(isBitcoinWithdrawalFulfilled).mockResolvedValue(true)
      vi.mocked(isBitcoinWithdrawalChallenged).mockResolvedValue(false)

      const status = await getHemiStatusOfBtcWithdrawal({
        hemiClient,
        withdrawal: {
          ...withdrawal,
          status: BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED,
        },
      })

      expect(status).toBe(BtcWithdrawStatus.WITHDRAWAL_SUCCEEDED)

      expect(vi.mocked(getBitcoinVaultStateAddress)).toHaveBeenCalledWith(
        hemiClient,
        { vaultAddress: vault },
      )
      expect(vi.mocked(isBitcoinWithdrawalFulfilled)).toHaveBeenCalledOnce()
      expect(vi.mocked(isBitcoinWithdrawalFulfilled)).toHaveBeenLastCalledWith(
        hemiClient,
        {
          uuid: BigInt(withdrawal.uuid),
          vaultStateAddress: zeroAddress,
        },
      )
    })

    it('should throw if the withdrawal has no vault', async function () {
      await expect(
        getHemiStatusOfBtcWithdrawal({
          hemiClient,
          withdrawal: {
            ...withdrawal,
            status: BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED,
            vault: undefined,
          },
        }),
      ).rejects.toThrow(
        `Missing vault for withdrawal ${withdrawal.transactionHash}`,
      )
    })

    it(`should return ${BtcWithdrawStatus.WITHDRAWAL_CHALLENGED} if the withdrawal has been challenged`, async function () {
      vi.mocked(isBitcoinWithdrawalFulfilled).mockResolvedValue(false)
      vi.mocked(isBitcoinWithdrawalChallenged).mockResolvedValue(true)

      const status = await getHemiStatusOfBtcWithdrawal({
        hemiClient,
        withdrawal: {
          ...withdrawal,
          status: BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED,
        },
      })

      expect(status).toBe(BtcWithdrawStatus.WITHDRAWAL_CHALLENGED)
      expect(vi.mocked(isBitcoinWithdrawalChallenged)).toHaveBeenCalledOnce()
      expect(vi.mocked(isBitcoinWithdrawalChallenged)).toHaveBeenLastCalledWith(
        hemiClient,
        {
          uuid: BigInt(withdrawal.uuid),
          vaultStateAddress: zeroAddress,
        },
      )
    })

    it(`should return ${BtcWithdrawStatus.READY_TO_CHALLENGE} if the withdrawal has not been challenged nor fulfilled, and the grace period has passed`, async function () {
      vi.mocked(isBitcoinWithdrawalFulfilled).mockResolvedValue(false)
      vi.mocked(isBitcoinWithdrawalChallenged).mockResolvedValue(false)
      vi.mocked(getBitcoinWithdrawalGracePeriod).mockResolvedValue(BigInt(3600)) // 1 hour

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

  describe('isValidBtcAddress', function () {
    const btcAddress = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'

    it('should return what BitcoinKit answers', async function () {
      vi.mocked(isAddressValid).mockResolvedValue(true)

      await expect(isValidBtcAddress(hemiClient, btcAddress)).resolves.toBe(
        true,
      )
    })

    it('should return false if the contract reverts', async function () {
      const err = new Error('reverted')
      err.cause = { name: 'ContractFunctionRevertedError' }
      vi.mocked(isAddressValid).mockRejectedValue(err)

      await expect(isValidBtcAddress(hemiClient, btcAddress)).resolves.toBe(
        false,
      )
    })

    it('should rethrow any other failure', async function () {
      const err = new Error('the RPC is down')
      err.cause = { name: 'HttpRequestError' }
      vi.mocked(isAddressValid).mockRejectedValue(err)

      await expect(isValidBtcAddress(hemiClient, btcAddress)).rejects.toThrow(
        'the RPC is down',
      )
    })
  })
})
