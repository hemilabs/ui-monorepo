import { hemiSepolia } from 'hemi-viem'
import { HemiPublicClient } from 'hooks/useHemiClient'
import { BtcWithdrawStatus, ToBtcWithdrawOperation } from 'types/tunnel'
import { getEvmTransactionReceipt } from 'utils/evmApi'
import { getHemiStatusOfBtcWithdrawal } from 'utils/hemi'
import { zeroAddress } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('utils/evmApi', () => ({
  getEvmTransactionReceipt: vi.fn(),
}))

const hemiClient: HemiPublicClient = {
  chain: hemiSepolia,
  getBitcoinVaultStateAddress: vi.fn(),
  getBitcoinWithdrawalGracePeriod: vi.fn(),
  getVaultByIndex: vi.fn(),
  getVaultChildIndex: vi.fn(),
  isBitcoinWithdrawalChallenged: vi.fn(),
  isBitcoinWithdrawalFulfilled: vi.fn(),
}

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

  describe('getHemiStatusOfBtcWithdrawal', function () {
    it(`should return ${BtcWithdrawStatus.INITIATE_WITHDRAW_PENDING} if the transaction receipt is not found`, async function () {
      vi.mocked(getEvmTransactionReceipt).mockResolvedValue(null)

      const status = await getHemiStatusOfBtcWithdrawal({
        hemiClient,
        withdrawal,
      })

      expect(status).toBe(BtcWithdrawStatus.INITIATE_WITHDRAW_PENDING)
    })

    it(`should return ${BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED} if the transaction receipt is found and successful`, async function () {
      vi.mocked(getEvmTransactionReceipt).mockResolvedValue({
        status: 'success',
      })

      const status = await getHemiStatusOfBtcWithdrawal({
        hemiClient,
        withdrawal,
      })

      expect(status).toBe(BtcWithdrawStatus.INITIATE_WITHDRAW_CONFIRMED)
    })

    it(`should return ${BtcWithdrawStatus.WITHDRAWAL_FAILED} if the transaction receipt is found and failed`, async function () {
      vi.mocked(getEvmTransactionReceipt).mockResolvedValue({
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
      hemiClient.getBitcoinVaultStateAddress.mockResolvedValue(zeroAddress)
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
      hemiClient.getBitcoinVaultStateAddress.mockResolvedValue(zeroAddress)
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
      hemiClient.getBitcoinVaultStateAddress.mockResolvedValue(zeroAddress)
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
