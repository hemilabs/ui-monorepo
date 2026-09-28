import { createErc20AllowanceStateOverride } from 'app/[locale]/hemi-stake/_utils/erc20StateOverride'
import { maxUint256, toHex } from 'viem'
import { describe, expect, it } from 'vitest'

const token = {
  address: '0x99e3dE3817F6081B2568208337ef83295b7f591D',
  chainId: 43111,
  decimals: 18,
  name: 'Hemi',
  symbol: 'HEMI',
}

describe('createErc20AllowanceStateOverride', function () {
  it('should return undefined when there is no owner', function () {
    expect(
      createErc20AllowanceStateOverride({
        owner: undefined,
        spender: '0x371d3718D5b7F75EAb050FAe6Da7DF3092031c89',
        token,
      }),
    ).toBeUndefined()
  })

  it('should set the max allowance in the owner and spender slot', function () {
    expect(
      createErc20AllowanceStateOverride({
        owner: '0x7Ce8B6f479c9c8D75C815C91b9acb1C3acE54906',
        spender: '0x371d3718D5b7F75EAb050FAe6Da7DF3092031c89',
        token,
      }),
    ).toEqual([
      {
        address: token.address,
        stateDiff: [
          {
            slot: '0x739908fceadd9a80979566f1d5322aceefa920adc2c2bed9ba9399a5b04bb806',
            value: toHex(maxUint256, { size: 32 }),
          },
        ],
      },
    ])
  })
})
