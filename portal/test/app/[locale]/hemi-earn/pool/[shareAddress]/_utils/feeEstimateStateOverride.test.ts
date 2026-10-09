import { maxUint256, toHex } from 'viem'
import { describe, expect, it } from 'vitest'

import { createFeeEstimateStateOverride } from '../../../../../../../app/[locale]/hemi-earn/pool/[shareAddress]/_utils/feeEstimateStateOverride'

const token = {
  address: '0x99e3dE3817F6081B2568208337ef83295b7f591D',
  chainId: 43111,
  decimals: 18,
  name: 'Hemi',
  symbol: 'HEMI',
}

const owner = '0x7Ce8B6f479c9c8D75C815C91b9acb1C3acE54906'
const spender = '0x371d3718D5b7F75EAb050FAe6Da7DF3092031c89'

const allowanceSlot =
  '0x739908fceadd9a80979566f1d5322aceefa920adc2c2bed9ba9399a5b04bb806'

describe('createFeeEstimateStateOverride', function () {
  it('should return undefined when there is no owner', function () {
    expect(
      createFeeEstimateStateOverride({
        needsApproval: true,
        owner: undefined,
        spender,
        token,
      }),
    ).toBeUndefined()
  })

  it('should override the balance even when no approval is needed', function () {
    expect(
      createFeeEstimateStateOverride({
        needsApproval: false,
        owner,
        spender,
        token,
      }),
    ).toEqual([{ address: owner, balance: maxUint256 }])
  })

  it('should add the allowance override when approval is needed', function () {
    expect(
      createFeeEstimateStateOverride({
        needsApproval: true,
        owner,
        spender,
        token,
      }),
    ).toEqual([
      { address: owner, balance: maxUint256 },
      {
        address: token.address,
        stateDiff: [
          { slot: allowanceSlot, value: toHex(maxUint256, { size: 32 }) },
        ],
      },
    ])
  })
})
