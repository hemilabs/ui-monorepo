import { isPositionOwner } from 'app/[locale]/staking-dashboard/_utils/positionOwnership'
import { describe, expect, it } from 'vitest'

const owner = '0xAbC0000000000000000000000000000000000001'

describe('isPositionOwner', function () {
  it('is false when no wallet is connected', function () {
    expect(isPositionOwner({ address: undefined, owner })).toBe(false)
  })

  it('is true for the current owner', function () {
    expect(isPositionOwner({ address: owner, owner })).toBe(true)
  })

  // The subgraph checksums addresses while wagmi may hand back either form, so a
  // case-sensitive compare would report every owner as a stranger.
  it('ignores address casing', function () {
    expect(isPositionOwner({ address: owner.toLowerCase(), owner })).toBe(true)
    expect(isPositionOwner({ address: owner.toUpperCase(), owner })).toBe(true)
  })

  it('is false for a wallet that only used to hold the position', function () {
    expect(
      isPositionOwner({
        address: '0xdEf0000000000000000000000000000000000002',
        owner,
      }),
    ).toBe(false)
  })
})
