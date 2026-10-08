import { isMenuEdgeItem } from 'utils/menu'
import { describe, expect, it } from 'vitest'

const first = {}
const middle = {}
const last = {}
const items = [first, middle, last]

describe('utils/menu', function () {
  describe('isMenuEdgeItem', function () {
    it('returns true for the last item on Tab', function () {
      expect(isMenuEdgeItem({ items, shiftKey: false, target: last })).toBe(
        true,
      )
    })

    it('returns true for the first item on Shift+Tab', function () {
      expect(isMenuEdgeItem({ items, shiftKey: true, target: first })).toBe(
        true,
      )
    })

    it('returns false for the first item on Tab', function () {
      expect(isMenuEdgeItem({ items, shiftKey: false, target: first })).toBe(
        false,
      )
    })

    it('returns false for the last item on Shift+Tab', function () {
      expect(isMenuEdgeItem({ items, shiftKey: true, target: last })).toBe(
        false,
      )
    })

    it('returns false for a middle item', function () {
      expect(isMenuEdgeItem({ items, shiftKey: false, target: middle })).toBe(
        false,
      )
      expect(isMenuEdgeItem({ items, shiftKey: true, target: middle })).toBe(
        false,
      )
    })

    it('returns false when the menu has no items', function () {
      expect(isMenuEdgeItem({ items: [], shiftKey: false, target: last })).toBe(
        false,
      )
    })
  })
})
