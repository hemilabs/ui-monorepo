import { claimIneligibility } from 'app/[locale]/staking-dashboard/_utils/claimEligibility'
import { describe, expect, it } from 'vitest'

// Mixed case on purpose: the rule must compare addresses case-insensitively, and a
// fixture that was already lower-case could not catch a regression to ===.
const holder = '0xAbC0000000000000000000000000000000000001'
const hemiChainId = 43111

const healthyState = {
  maxTokensPerClaim: BigInt(8),
  paused: false,
  tokens: ['a', 'b'],
}

const eligibility = (overrides = {}) =>
  claimIneligibility({
    address: holder,
    connectedChainId: hemiChainId,
    generation: 'epoch',
    hasRewards: true,
    hemiChainId,
    isRewardsUnavailable: false,
    owner: holder,
    systemState: healthyState,
    ...overrides,
  })

describe('claimIneligibility', function () {
  describe('the original contract', function () {
    it('allows the claim when the position has rewards', function () {
      expect(eligibility({ generation: 'continuous' })).toBeUndefined()
    })

    it('blocks it when the position has none', function () {
      expect(eligibility({ generation: 'continuous', hasRewards: false })).toBe(
        'nothing-claimable',
      )
    })

    it('does not consult the epoch system state', function () {
      expect(
        eligibility({
          generation: 'continuous',
          systemState: { ...healthyState, paused: true },
        }),
      ).toBeUndefined()
    })

    // The ORIGINAL contract pays the current owner only, so a sold position is offered
    // a Claim that can only revert. This is the exact opposite of the epoch branch
    // below; the asymmetry is deliberate.
    it('refuses a position the wallet sold, which that contract will not pay', function () {
      expect(
        eligibility({
          generation: 'continuous',
          owner: '0x1111111111111111111111111111111111111111',
        }),
      ).toBe('not-holder')
    })

    it('distinguishes an unresolved read from an empty one there too', function () {
      expect(
        eligibility({ generation: 'continuous', hasRewards: undefined }),
      ).toBe('rewards-loading')
      expect(
        eligibility({
          generation: 'continuous',
          hasRewards: undefined,
          isRewardsUnavailable: true,
        }),
      ).toBe('rewards-unavailable')
    })
  })

  describe('the epoch contract', function () {
    it('allows the claim for a holder with rewards on Hemi', function () {
      expect(eligibility()).toBeUndefined()
    })

    // The contract pays whoever HELD the position at each epoch, and `claim` requires
    // only that the caller is the holder it names. Verified on the devnet: position 8
    // is owned by one wallet while a PREVIOUS owner is owed 59.57 HEMI, and `claim`
    // from that previous owner simulates successfully. Refusing it here withheld money
    // the contract would have paid, and said the contract forbade it.
    it('allows a wallet that no longer holds the position but is still owed', function () {
      expect(
        eligibility({ owner: '0x1111111111111111111111111111111111111111' }),
      ).toBeUndefined()
    })

    it('blocks a disconnected wallet, which has no holder to claim for', function () {
      expect(eligibility({ address: undefined })).toBe('not-connected')
    })

    it('says nothing is claimable for a past owner who is owed nothing', function () {
      expect(eligibility({ hasRewards: false })).toBe('nothing-claimable')
    })

    it('blocks a wallet connected to another chain', function () {
      expect(eligibility({ connectedChainId: 1 })).toBe('wrong-chain')
    })

    it('does not report a chain it cannot read', function () {
      expect(eligibility({ connectedChainId: undefined })).toBeUndefined()
    })

    it('blocks while the contract is paused', function () {
      expect(
        eligibility({ systemState: { ...healthyState, paused: true } }),
      ).toBe('paused')
    })

    it('blocks when the registry is wider than one token page', function () {
      expect(
        eligibility({
          systemState: {
            ...healthyState,
            maxTokensPerClaim: BigInt(2),
            tokens: ['a', 'b', 'c'],
          },
        }),
      ).toBe('registry-too-large')
    })

    it('allows a registry exactly one token page wide', function () {
      expect(
        eligibility({
          systemState: {
            ...healthyState,
            maxTokensPerClaim: BigInt(2),
            tokens: ['a', 'b'],
          },
        }),
      ).toBeUndefined()
    })

    // Pins the rule to the cap the contract reports rather than to any fixed number:
    // the same registry is allowed under one cap and refused under another.
    it('reads the cap from the contract rather than assuming one', function () {
      const tokens = ['a', 'b', 'c']
      expect(
        eligibility({
          systemState: {
            ...healthyState,
            maxTokensPerClaim: BigInt(8),
            tokens,
          },
        }),
      ).toBeUndefined()
      expect(
        eligibility({
          systemState: {
            ...healthyState,
            maxTokensPerClaim: BigInt(1),
            tokens,
          },
        }),
      ).toBe('registry-too-large')
    })

    it('blocks when nothing is claimable', function () {
      expect(eligibility({ hasRewards: false })).toBe('nothing-claimable')
    })

    // A read that has not answered is not a position with nothing owed. Saying so would
    // tell a holder who IS owed rewards that there are none.
    it('does not claim there is nothing owed while the read is in flight', function () {
      expect(eligibility({ hasRewards: undefined })).toBe('rewards-loading')
    })

    it('says so when the read failed or never ran', function () {
      expect(
        eligibility({ hasRewards: undefined, isRewardsUnavailable: true }),
      ).toBe('rewards-unavailable')
    })

    it('reports the registry fault ahead of an unresolved read', function () {
      expect(
        eligibility({
          hasRewards: undefined,
          systemState: {
            ...healthyState,
            maxTokensPerClaim: BigInt(1),
            tokens: ['a', 'b'],
          },
        }),
      ).toBe('registry-too-large')
    })

    it('does not guess at the registry size before the system state loads', function () {
      expect(
        eligibility({ hasRewards: true, systemState: undefined }),
      ).toBeUndefined()
    })

    describe('reason precedence', function () {
      it('reports not-connected over every other fault', function () {
        expect(
          eligibility({
            address: undefined,
            connectedChainId: 1,
            hasRewards: false,
            systemState: { ...healthyState, paused: true },
          }),
        ).toBe('not-connected')
      })

      it('reports wrong-chain over a paused contract', function () {
        expect(
          eligibility({
            connectedChainId: 1,
            systemState: { ...healthyState, paused: true },
          }),
        ).toBe('wrong-chain')
      })

      it('reports paused over an oversized registry', function () {
        expect(
          eligibility({
            systemState: {
              maxTokensPerClaim: BigInt(1),
              paused: true,
              tokens: ['a', 'b'],
            },
          }),
        ).toBe('paused')
      })

      // Paused is the one reason the UI keeps the amount on screen for, so it must not
      // be masked by the emptier "nothing to claim".
      it('reports paused over nothing-claimable', function () {
        expect(
          eligibility({
            hasRewards: false,
            systemState: { ...healthyState, paused: true },
          }),
        ).toBe('paused')
      })
    })
  })
})
