import { getL1LogoURI } from 'utils/l1Logo'
import { describe, expect, it } from 'vitest'

describe('utils/l1Logo', function () {
  describe('getL1LogoURI', function () {
    it('should return the L1 version of a token list logo', function () {
      expect(
        getL1LogoURI({
          logoURI: 'https://hemilabs.github.io/token-list/logos/hemibtc.svg',
        }),
      ).toBe('https://hemilabs.github.io/token-list/l1Logos/hemibtc.svg')
    })

    it('should return undefined for an L1 logo', function () {
      expect(
        getL1LogoURI({
          logoURI: 'https://hemilabs.github.io/token-list/l1Logos/eth.svg',
        }),
      ).toBeUndefined()
    })

    it('should return undefined for a logo outside the token list', function () {
      expect(
        getL1LogoURI({ logoURI: 'https://example.com/logos/token.svg' }),
      ).toBeUndefined()
    })

    it('should return undefined when there is no logo', function () {
      expect(getL1LogoURI({})).toBeUndefined()
    })
  })
})
