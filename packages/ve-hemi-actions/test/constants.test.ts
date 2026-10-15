import { describe, expect, it } from 'vitest'

import { SixDaysSeconds, snapToEpoch } from '../constants'

describe('snapToEpoch', function () {
  const epochStart = SixDaysSeconds * 3232

  it('keeps a timestamp that is already on the epoch grid', function () {
    expect(snapToEpoch(epochStart)).toBe(epochStart)
  })

  it('rounds down to the start of the epoch', function () {
    expect(snapToEpoch(epochStart + 1)).toBe(epochStart)
    expect(snapToEpoch(epochStart + SixDaysSeconds - 1)).toBe(epochStart)
  })

  it('rounds a real lock end like the contract', function () {
    // Values of a position on Hemi mainnet: the contract stored 1771959240.
    expect(snapToEpoch(1756428611 + 15778800)).toBe(1771959240)
  })
})
