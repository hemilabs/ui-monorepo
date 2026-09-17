import {
  combineClaimable,
  type ClaimableResult,
} from 'app/[locale]/staking-dashboard/_utils/claimTotals'
import { describe, expect, it } from 'vitest'

const one = BigInt(1)
const two = BigInt(2)

const hemi = '0xaaaa'
const hemiBtc = '0xbbbb'

const row = (token: string, claimable: bigint) => ({
  claimable,
  decimals: token === hemiBtc ? 8 : 18,
  symbol: token === hemiBtc ? 'hemiBTC' : 'HEMI',
  token,
})

const resolved = (...rows: ReturnType<typeof row>[]): ClaimableResult => ({
  data: rows,
  fetchStatus: 'idle',
  status: 'success',
})
const loading: ClaimableResult = { fetchStatus: 'fetching', status: 'pending' }
// A disabled query never resolves and never fails: pending and idle.
const disabled: ClaimableResult = { fetchStatus: 'idle', status: 'pending' }
const failed: ClaimableResult = { fetchStatus: 'idle', status: 'error' }

const combine = (results: ClaimableResult[], tokenIds = [one, two]) =>
  combineClaimable({ results, systemStateStatus: 'success', tokenIds })

describe('combineClaimable', function () {
  it('adds one asset across positions and keeps its decimals', function () {
    const { totals } = combine([
      resolved(row(hemi, BigInt(30))),
      resolved(row(hemi, BigInt(12))),
    ])
    expect(totals).toEqual([
      { claimable: BigInt(42), decimals: 18, symbol: 'HEMI', token: hemi },
    ])
  })

  it('keeps assets apart, each with its own decimals', function () {
    const { totals } = combine([
      resolved(row(hemi, BigInt(30)), row(hemiBtc, BigInt(5))),
      resolved(row(hemiBtc, BigInt(7))),
    ])
    expect(totals).toEqual([
      { claimable: BigInt(30), decimals: 18, symbol: 'HEMI', token: hemi },
      { claimable: BigInt(12), decimals: 8, symbol: 'hemiBTC', token: hemiBtc },
    ])
  })

  it('leaves out an asset nothing is owed in', function () {
    const { totals } = combine([
      resolved(row(hemi, BigInt(0))),
      resolved(row(hemi, BigInt(0))),
    ])
    expect(totals).toEqual([])
  })

  // The rule this helper exists for: a sum missing one position's money is not a total,
  // and a claim-all offered against it would leave rewards behind.
  it('is pending while any position is still being read', function () {
    const combined = combine([resolved(row(hemi, BigInt(30))), loading])
    expect(combined.isPending).toBe(true)
    expect(combined.isUnavailable).toBe(false)
  })

  it('is unavailable when a read failed, not merely pending', function () {
    const combined = combine([resolved(row(hemi, BigInt(30))), failed])
    expect(combined.isUnavailable).toBe(true)
    expect(combined.isPending).toBe(false)
  })

  // Disabled is pending + idle, which is how a query that never ran is told apart from
  // one still running.
  it('is unavailable when a read never ran', function () {
    expect(combine([disabled, disabled]).isUnavailable).toBe(true)
  })

  // The epoch grid bounds these reads, so until it lands they sit disabled - an ordinary
  // first paint, not a failure.
  it('stays merely pending while the system state is still loading', function () {
    const combined = combineClaimable({
      results: [disabled, disabled],
      systemStateStatus: 'pending',
      tokenIds: [one, two],
    })
    expect(combined.isUnavailable).toBe(false)
    expect(combined.isPending).toBe(true)
  })

  it('is unavailable when the system state itself failed', function () {
    const combined = combineClaimable({
      results: [resolved(row(hemi, BigInt(30)))],
      systemStateStatus: 'error',
      tokenIds: [one],
    })
    expect(combined.isUnavailable).toBe(true)
  })

  it('names only the positions with something owed', function () {
    const { claimableTokenIds } = combine([
      resolved(row(hemi, BigInt(0))),
      resolved(row(hemi, BigInt(9))),
    ])
    expect(claimableTokenIds).toEqual([two])
  })

  // A position whose read hasn't landed isn't known to owe anything, and prompting for
  // it would cost a signature to transfer nothing.
  it('leaves out a position whose read has not landed', function () {
    const { claimableTokenIds } = combine([
      loading,
      resolved(row(hemi, BigInt(9))),
    ])
    expect(claimableTokenIds).toEqual([two])
  })
})

// Alongside `isUnavailable: true` the figure is a partial sum - what landed before a read
// failed. It is returned rather than blanked, but no caller may render it as a total.
// These pin that it really is partial.
describe('a failed read makes the total partial, not merely late', function () {
  it('leaves the surviving positions in totals', function () {
    const combined = combine([resolved(row(hemi, BigInt(30))), failed])
    expect(combined.isUnavailable).toBe(true)
    expect(combined.totals).toEqual([
      { claimable: BigInt(30), decimals: 18, symbol: 'HEMI', token: hemi },
    ])
  })

  it('under-reports by exactly the position that failed', function () {
    const whole = combine([
      resolved(row(hemi, BigInt(30))),
      resolved(row(hemi, BigInt(12))),
    ])
    const partial = combine([resolved(row(hemi, BigInt(30))), failed])
    expect(whole.totals[0].claimable).toBe(BigInt(42))
    expect(partial.totals[0].claimable).toBe(BigInt(30))
  })
})
