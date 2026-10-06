import { formatApy } from 'app/[locale]/hemi-stake/_utils/formatApy'
import { describe, expect, it } from 'vitest'

describe('formatApy', function () {
  it('reads its input as a ratio, not as a percentage', function () {
    expect(formatApy(18.4939)).toBe('1,849.39%')
  })

  it('formats a return below the staked amount', function () {
    expect(formatApy(0.5973)).toBe('59.73%')
  })

  it('formats nothing earned as zero', function () {
    expect(formatApy(0)).toBe('0.00%')
  })
})
