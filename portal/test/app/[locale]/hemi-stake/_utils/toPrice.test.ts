import { toPrice } from 'app/[locale]/hemi-stake/_utils/toPrice'
import { describe, expect, it } from 'vitest'

describe('toPrice', function () {
  it('should return the price as a number', function () {
    expect(toPrice('0.99')).toBe(0.99)
  })

  it('should have no price to offer when there is no value', function () {
    expect(toPrice(undefined)).toBeUndefined()
  })

  it.each(['0', 'not a number', ''])(
    'should reject %p rather than price against it',
    function (price) {
      expect(toPrice(price)).toBeUndefined()
    },
  )
})
