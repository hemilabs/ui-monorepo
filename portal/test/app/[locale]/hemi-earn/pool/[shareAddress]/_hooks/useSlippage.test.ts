import { describe, expect, it } from 'vitest'

import {
  defaultDepositSlippage,
  defaultRedeemSlippage,
} from '../../../../../../../app/[locale]/hemi-earn/_constants/slippage'
import { getDefaultSlippage } from '../../../../../../../app/[locale]/hemi-earn/pool/[shareAddress]/_hooks/useSlippage'

describe('getDefaultSlippage', function () {
  it('resolves the deposit default', function () {
    expect(getDefaultSlippage('deposit')).toBe(defaultDepositSlippage)
  })

  it('resolves the redeem default, which is wider than the deposit one', function () {
    expect(getDefaultSlippage('withdraw')).toBe(defaultRedeemSlippage)
    expect(defaultRedeemSlippage).toBeGreaterThan(defaultDepositSlippage)
  })
})
