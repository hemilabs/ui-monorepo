import { formatApyFromRatio } from 'app/[locale]/hemi-stake/_utils/formatApyFromRatio'
import { createFormatter } from 'utils/format'
import { describe, expect, it } from 'vitest'

const formatter = createFormatter('en')

describe('formatApyFromRatio', function () {
  it('reads its input as a ratio, not as a percentage', function () {
    expect(formatApyFromRatio(18.4939, formatter)).toBe('1,849.39%')
  })

  it('formats a return below the staked amount', function () {
    expect(formatApyFromRatio(0.5973, formatter)).toBe('59.73%')
  })

  it('carries the sub-hundredth floor through the conversion', function () {
    expect(formatApyFromRatio(0.00005, formatter)).toBe('< 0.01%')
  })

  it('formats nothing earned as zero', function () {
    expect(formatApyFromRatio(0, formatter)).toBe('0.00%')
  })
})
