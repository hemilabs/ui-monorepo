import { MessageDirection, MessageStatus } from '@eth-optimism/sdk'
import {
  BtcDepositStatus,
  BtcWithdrawStatus,
  EvmDepositStatus,
} from 'types/tunnel'
import { isDeposit, isPendingOperation } from 'utils/tunnel'
import { describe, it, expect } from 'vitest'

describe('utils/tunnel', function () {
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
        it('should return true if status is not BTC_DEPOSITED or DEPOSIT_TX_FAILED', function () {
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

        it('should return false if status is DEPOSIT_TX_CONFIRMED', function () {
          const operation = {
            direction: MessageDirection.L1_TO_L2,
            l1ChainId: 123456,
            status: EvmDepositStatus.DEPOSIT_TX_CONFIRMED,
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
