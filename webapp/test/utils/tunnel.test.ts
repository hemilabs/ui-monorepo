import {
  BtcDepositStatus,
  BtcWithdrawStatus,
  MessageDirection,
  MessageStatus,
  EvmDepositStatus,
} from 'types/tunnel'
import {
  getEvmWithdrawalStatus,
  isDeposit,
  isPendingOperation,
} from 'utils/tunnel'
import { hemiSepolia } from 'viem/chains'
import { getWithdrawalStatus } from 'viem/op-stack'
import { beforeEach, describe, it, expect, vi } from 'vitest'

vi.mock('viem/op-stack', () => ({
  getWithdrawalStatus: vi.fn(),
}))

describe('utils/tunnel', function () {
  beforeEach(function () {
    vi.clearAllMocks()
  })

  describe('getEvmWithdrawalStatus', function () {
    const parameters = {
      l1publicClient: {},
      l2ChainId: hemiSepolia.id,
      receipt: { status: 'success' },
    }

    it('should return RELAYED when the withdrawal status is finalized', async function () {
      vi.mocked(getWithdrawalStatus).mockResolvedValue('finalized')

      const status = await getEvmWithdrawalStatus(parameters)

      expect(status).toBe(MessageStatus.RELAYED)
    })

    it('should return READY_FOR_RELAY when the withdrawal status is ready-to-finalize', async function () {
      vi.mocked(getWithdrawalStatus).mockResolvedValue('ready-to-finalize')

      const status = await getEvmWithdrawalStatus(parameters)

      expect(status).toBe(MessageStatus.READY_FOR_RELAY)
    })

    it('should return READY_TO_PROVE when the withdrawal status is ready-to-prove', async function () {
      vi.mocked(getWithdrawalStatus).mockResolvedValue('ready-to-prove')

      const status = await getEvmWithdrawalStatus(parameters)

      expect(status).toBe(MessageStatus.READY_TO_PROVE)
    })

    it('should return IN_CHALLENGE_PERIOD when the withdrawal status is waiting-to-finalize', async function () {
      vi.mocked(getWithdrawalStatus).mockResolvedValue('waiting-to-finalize')

      const status = await getEvmWithdrawalStatus(parameters)

      expect(status).toBe(MessageStatus.IN_CHALLENGE_PERIOD)
    })

    it('should return STATE_ROOT_NOT_PUBLISHED when the withdrawal status is waiting-to-prove', async function () {
      vi.mocked(getWithdrawalStatus).mockResolvedValue('waiting-to-prove')

      const status = await getEvmWithdrawalStatus(parameters)

      expect(status).toBe(MessageStatus.STATE_ROOT_NOT_PUBLISHED)
    })

    it('should return FAILED_L1_TO_L2_MESSAGE when the receipt status is reverted', async function () {
      vi.mocked(getWithdrawalStatus).mockRejectedValue(
        new Error('should not be reached'),
      )
      const status = await getEvmWithdrawalStatus({
        ...parameters,
        receipt: { status: 'reverted' },
      })

      expect(status).toBe(MessageStatus.FAILED_L1_TO_L2_MESSAGE)
    })
  })

  describe('isDeposit', function () {
    it(`should identify deposit operations if the direction is ${MessageDirection.L1_TO_L2}`, function () {
      const operation = {
        direction: MessageDirection.L1_TO_L2,
      }
      // @ts-expect-error Ignore operation fields not required for this test
      expect(isDeposit(operation)).toBe(true)
    })

    it(`should not identify operations as deposit if the direction is not ${MessageDirection.L1_TO_L2}`, function () {
      const operation = {
        direction: MessageDirection.L2_TO_L1,
      }
      // @ts-expect-error Ignore operation fields not required for this test
      expect(isDeposit(operation)).toBe(false)
    })
  })

  describe('isPendingOperation', function () {
    describe('when the operation is a deposit', function () {
      describe('BTC', function () {
        it('should return true if status is not BTC_DEPOSITED, BTC_DEPOSITED_MANUALLY or DEPOSIT_TX_FAILED', function () {
          const operation = {
            direction: MessageDirection.L1_TO_L2,
            l1ChainId: '123456',
            status: BtcDepositStatus.READY_TO_MANUAL_CONFIRM,
          }
          // @ts-expect-error Ignore operation fields not required for this test
          expect(isPendingOperation(operation)).toBe(true)
        })

        it('should return false if status is BTC_DEPOSITED', function () {
          const operation = {
            direction: MessageDirection.L1_TO_L2,
            l1ChainId: '123456',
            status: BtcDepositStatus.BTC_DEPOSITED,
          }
          // @ts-expect-error Ignore operation fields not required for this test
          expect(isPendingOperation(operation)).toBe(false)
        })

        it('should return false if status is DEPOSIT_TX_FAILED', function () {
          const operation = {
            direction: MessageDirection.L1_TO_L2,
            l1ChainId: '123456',
            status: BtcDepositStatus.DEPOSIT_MANUAL_CONFIRMATION_TX_FAILED,
          }
          // @ts-expect-error Ignore operation fields not required for this test
          expect(isPendingOperation(operation)).toBe(false)
        })

        it('should return false if status is BTC_DEPOSITED_MANUALLY', function () {
          const operation = {
            direction: MessageDirection.L1_TO_L2,
            l1ChainId: '123456',
            status: BtcDepositStatus.BTC_DEPOSITED_MANUALLY,
          }
          // @ts-expect-error Ignore operation fields not required for this test
          expect(isPendingOperation(operation)).toBe(false)
        })
      })

      describe('EVM', function () {
        it('should return true if status is not DEPOSIT_TX_CONFIRMED or DEPOSIT_TX_FAILED', function () {
          const operation = {
            direction: MessageDirection.L1_TO_L2,
            l1ChainId: 123456,
            status: EvmDepositStatus.APPROVAL_TX_PENDING,
          }
          // @ts-expect-error Ignore operation fields not required for this test
          expect(isPendingOperation(operation)).toBe(true)
        })

        it('should return false if status is DEPOSIT_RELAYED', function () {
          const operation = {
            direction: MessageDirection.L1_TO_L2,
            l1ChainId: 123456,
            status: EvmDepositStatus.DEPOSIT_RELAYED,
          }
          // @ts-expect-error Ignore operation fields not required for this test
          expect(isPendingOperation(operation)).toBe(false)
        })

        it('should return false if status is DEPOSIT_TX_FAILED', function () {
          const operation = {
            direction: MessageDirection.L1_TO_L2,
            l1ChainId: 123456,
            status: EvmDepositStatus.DEPOSIT_TX_FAILED,
          }
          // @ts-expect-error Ignore operation fields not required for this test
          expect(isPendingOperation(operation)).toBe(false)
        })
      })
    })

    describe('when the operation is a withdraw', function () {
      describe('BTC', function () {
        it(`should return true if status is not WITHDRAWAL_FAILED, 
          WITHDRAWAL_SUCCEEDED, WITHDRAWAL_CHALLENGED or CHALLENGE_FAILED`, function () {
          const operation = {
            direction: MessageDirection.L2_TO_L1,
            l1ChainId: '123456',
            status: BtcWithdrawStatus.CHALLENGE_IN_PROGRESS,
          }
          // @ts-expect-error Ignore operation fields not required for this test
          expect(isPendingOperation(operation)).toBe(true)
        })

        it('should return false if status is WITHDRAWAL_FAILED', function () {
          const operation = {
            direction: MessageDirection.L2_TO_L1,
            l1ChainId: '123456',
            status: BtcWithdrawStatus.WITHDRAWAL_FAILED,
          }
          // @ts-expect-error Ignore operation fields not required for this test
          expect(isPendingOperation(operation)).toBe(false)
        })

        it('should return false if status is WITHDRAWAL_SUCCEEDED', function () {
          const operation = {
            direction: MessageDirection.L2_TO_L1,
            l1ChainId: '123456',
            status: BtcWithdrawStatus.WITHDRAWAL_SUCCEEDED,
          }
          // @ts-expect-error Ignore operation fields not required for this test
          expect(isPendingOperation(operation)).toBe(false)
        })

        it('should return false if status is WITHDRAWAL_CHALLENGED', function () {
          const operation = {
            direction: MessageDirection.L2_TO_L1,
            l1ChainId: '123456',
            status: BtcWithdrawStatus.WITHDRAWAL_CHALLENGED,
          }
          // @ts-expect-error Ignore operation fields not required for this test
          expect(isPendingOperation(operation)).toBe(false)
        })

        it('should return false if status is CHALLENGE_FAILED', function () {
          const operation = {
            direction: MessageDirection.L2_TO_L1,
            l1ChainId: '123456',
            status: BtcWithdrawStatus.CHALLENGE_FAILED,
          }
          // @ts-expect-error Ignore operation fields not required for this test
          expect(isPendingOperation(operation)).toBe(false)
        })
      })

      describe('EVM', function () {
        it('should return true if status is not RELAYED', function () {
          const operation = {
            direction: MessageDirection.L2_TO_L1,
            l1ChainId: 123456,
            status: MessageStatus.READY_TO_PROVE,
          }
          // @ts-expect-error Ignore operation fields not required for this test
          expect(isPendingOperation(operation)).toBe(true)
        })

        it('should return false if status is RELAYED', function () {
          const operation = {
            direction: MessageDirection.L2_TO_L1,
            l1ChainId: 123456,
            status: MessageStatus.RELAYED,
          }
          // @ts-expect-error Ignore operation fields not required for this test
          expect(isPendingOperation(operation)).toBe(false)
        })
      })
    })
  })
})
