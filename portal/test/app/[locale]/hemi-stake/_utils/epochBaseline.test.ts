import { getBaseline } from 'app/[locale]/hemi-stake/_utils/epochBaseline'
import { stringToHex } from 'viem'
import { describe, expect, it } from 'vitest'

const label = (text: string) => stringToHex(text, { size: 32 })

const stream = (text: string, transferable: number) => ({
  fundedByClass: { transferable: BigInt(transferable) },
  label: label(text),
})

describe('getBaseline', function () {
  it('takes the transferable share of the baseline stream', function () {
    expect(
      getBaseline([stream('baseline', 4_166_666), stream('other', 1)]),
    ).toBe(BigInt(4_166_666))
  })

  it('leaves the fees out, they are collected rather than budgeted', function () {
    expect(getBaseline([stream('transaction-fees', 15_000)])).toBe(BigInt(0))
  })

  it('adds up every baseline stream, since a label can repeat', function () {
    expect(
      getBaseline([stream('baseline', 4_000_000), stream('baseline', 166_666)]),
    ).toBe(BigInt(4_166_666))
  })

  it('finds the baseline wherever it sits in the list', function () {
    expect(
      getBaseline([
        stream('transaction-fees', 15_000),
        stream('baseline', 4_166_666),
      ]),
    ).toBe(BigInt(4_166_666))
  })

  it('has no baseline to offer for an epoch nothing funded', function () {
    expect(getBaseline([])).toBe(BigInt(0))
  })
})
