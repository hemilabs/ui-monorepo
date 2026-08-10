import { type Hash } from 'viem'
import { describe, expect, it } from 'vitest'

import {
  claimRecoverSettlement,
  enrichWithSettlement,
  findLocalSettlement,
  remoteFailedSettlement,
  unstakeSettlement,
} from '../../../../../app/[locale]/hemi-earn/_utils/settlement'
import {
  type EarnSettlement,
  type LocalEarnOperation,
} from '../../../../../app/[locale]/hemi-earn/types'

import { baseTx, claimHash } from './fixtures'

describe('settlement', function () {
  describe('claimRecoverSettlement', function () {
    it('returns a CLAIM settlement unchanged', function () {
      const settlement: EarnSettlement = {
        failed: false,
        kind: 'CLAIM',
        txHash: claimHash,
      }
      expect(claimRecoverSettlement(settlement)).toBe(settlement)
    })

    it('returns a RECOVER settlement unchanged', function () {
      const settlement: EarnSettlement = { failed: true, kind: 'RECOVER' }
      expect(claimRecoverSettlement(settlement)).toBe(settlement)
    })

    it('strips a pending CANCEL marker (the cancel signal, not a settlement)', function () {
      expect(
        claimRecoverSettlement({ failed: false, kind: 'CANCEL' }),
      ).toBeUndefined()
    })

    it('strips a reverted CANCEL marker too', function () {
      expect(
        claimRecoverSettlement({ failed: true, kind: 'CANCEL' }),
      ).toBeUndefined()
    })

    it('strips an UNSTAKE marker (the Ethereum finalize, not a settlement)', function () {
      expect(
        claimRecoverSettlement({ failed: false, kind: 'UNSTAKE' }),
      ).toBeUndefined()
      expect(
        claimRecoverSettlement({ failed: true, kind: 'UNSTAKE' }),
      ).toBeUndefined()
    })

    it('strips RETRY and CANCEL_REQUEST markers (Agent-side, not a settlement)', function () {
      expect(
        claimRecoverSettlement({ failed: false, kind: 'RETRY' }),
      ).toBeUndefined()
      expect(
        claimRecoverSettlement({ failed: true, kind: 'CANCEL_REQUEST' }),
      ).toBeUndefined()
    })

    it('returns undefined for no settlement', function () {
      expect(claimRecoverSettlement(undefined)).toBeUndefined()
    })
  })

  describe('enrichWithSettlement', function () {
    const settlement: EarnSettlement = { failed: true, kind: 'RECOVER' }

    it('folds the settlement onto the row', function () {
      expect(enrichWithSettlement(baseTx, settlement)).toEqual({
        ...baseTx,
        settlement,
      })
    })

    it('returns the row unchanged when there is no settlement', function () {
      expect(enrichWithSettlement(baseTx, undefined)).toBe(baseTx)
    })

    it('returns undefined when the row is undefined', function () {
      expect(enrichWithSettlement(undefined, settlement)).toBeUndefined()
    })
  })

  describe('findLocalSettlement', function () {
    const reqHash = `0x${'b'.repeat(64)}` as Hash
    const settlement: EarnSettlement = {
      failed: false,
      kind: 'CLAIM',
      txHash: claimHash,
    }
    const makeLocalOp = (
      initiateTxHash: string | undefined,
      withSettlement?: EarnSettlement,
    ) =>
      ({
        initiateTxHash,
        settlement: withSettlement,
      }) as unknown as LocalEarnOperation

    it('returns the settlement of the op matching the request tx', function () {
      const ops = [
        makeLocalOp(`0x${'9'.repeat(64)}`),
        makeLocalOp(reqHash, settlement),
      ]
      expect(findLocalSettlement(ops, reqHash)).toBe(settlement)
    })

    it('matches the request tx case-insensitively', function () {
      const ops = [makeLocalOp(`0x${'B'.repeat(64)}`, settlement)]
      expect(findLocalSettlement(ops, reqHash)).toBe(settlement)
    })

    it('returns undefined when no op matches', function () {
      expect(
        findLocalSettlement(
          [makeLocalOp(`0x${'9'.repeat(64)}`, settlement)],
          reqHash,
        ),
      ).toBeUndefined()
    })

    it('returns undefined when requestTxHash is undefined', function () {
      expect(
        findLocalSettlement([makeLocalOp(reqHash, settlement)], undefined),
      ).toBeUndefined()
    })

    it('skips ops without an initiateTxHash', function () {
      expect(
        findLocalSettlement([makeLocalOp(undefined, settlement)], reqHash),
      ).toBeUndefined()
    })

    it('returns undefined when the matching op has no settlement', function () {
      expect(
        findLocalSettlement([makeLocalOp(reqHash)], reqHash),
      ).toBeUndefined()
    })
  })

  describe('remoteFailedSettlement', function () {
    it('returns a RETRY marker unchanged', function () {
      const settlement: EarnSettlement = { failed: false, kind: 'RETRY' }
      expect(remoteFailedSettlement(settlement)).toBe(settlement)
    })

    it('returns a CANCEL_REQUEST marker unchanged', function () {
      const settlement: EarnSettlement = {
        failed: true,
        kind: 'CANCEL_REQUEST',
      }
      expect(remoteFailedSettlement(settlement)).toBe(settlement)
    })

    it('ignores claim/recover/unstake markers', function () {
      expect(
        remoteFailedSettlement({ failed: false, kind: 'CLAIM' }),
      ).toBeUndefined()
      expect(
        remoteFailedSettlement({ failed: false, kind: 'UNSTAKE' }),
      ).toBeUndefined()
    })

    it('returns undefined for no settlement', function () {
      expect(remoteFailedSettlement(undefined)).toBeUndefined()
    })
  })

  describe('unstakeSettlement', function () {
    it('returns an UNSTAKE marker unchanged', function () {
      const settlement: EarnSettlement = { failed: false, kind: 'UNSTAKE' }
      expect(unstakeSettlement(settlement)).toBe(settlement)
    })

    it.each<EarnSettlement['kind']>(['CLAIM', 'RECOVER', 'CANCEL'])(
      'returns undefined for a %s marker',
      function (kind) {
        expect(unstakeSettlement({ failed: false, kind })).toBeUndefined()
      },
    )

    it('returns undefined for no settlement', function () {
      expect(unstakeSettlement(undefined)).toBeUndefined()
    })
  })
})
