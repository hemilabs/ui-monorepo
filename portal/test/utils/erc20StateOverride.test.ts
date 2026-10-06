import { createErc20AllowanceStateOverride } from 'utils/erc20StateOverride'
import { maxUint256, toHex } from 'viem'
import { describe, expect, it } from 'vitest'

const token = {
  address: '0x99e3dE3817F6081B2568208337ef83295b7f591D',
  chainId: 43111,
  decimals: 18,
  name: 'Hemi',
  symbol: 'HEMI',
}

const owner = '0x7Ce8B6f479c9c8D75C815C91b9acb1C3acE54906'
const spender = '0x371d3718D5b7F75EAb050FAe6Da7DF3092031c89'

describe('createErc20AllowanceStateOverride', function () {
  it('should return undefined when there is no owner', function () {
    expect(
      createErc20AllowanceStateOverride({
        owner: undefined,
        spender,
        token,
      }),
    ).toBeUndefined()
  })

  it('should set the max allowance in the owner and spender slot', function () {
    expect(
      createErc20AllowanceStateOverride({ owner, spender, token }),
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

  it('should fall back to the default when the token declares no slot', function () {
    expect(
      createErc20AllowanceStateOverride({
        owner,
        spender,
        token: { ...token, extensions: { birthBlock: 1 } },
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

  it('should fall back when the declared slot is not a storage index', function () {
    const defaultSlot =
      '0x739908fceadd9a80979566f1d5322aceefa920adc2c2bed9ba9399a5b04bb806'
    const slotOf = extensions =>
      createErc20AllowanceStateOverride({
        owner,
        spender,
        token: { ...token, extensions },
      })[0].stateDiff[0].slot

    expect(slotOf({ allowanceSlot: 1.5 })).toBe(defaultSlot)
    expect(slotOf({ allowanceSlot: -1 })).toBe(defaultSlot)
    expect(slotOf({ allowanceSlot: '10' })).toBe(defaultSlot)
  })

  it('should keep slot zero instead of falling back', function () {
    expect(
      createErc20AllowanceStateOverride({
        owner,
        spender,
        token: { ...token, extensions: { allowanceSlot: 0 } },
      }),
    ).toEqual([
      {
        address: token.address,
        stateDiff: [
          {
            slot: '0x797a9a556bd36802a1a8e317b1b4b70a0637212055e707608f4d5bbfda7bee1c',
            value: toHex(maxUint256, { size: 32 }),
          },
        ],
      },
    ])
  })

  it('should use the allowance slot the token declares', function () {
    expect(
      createErc20AllowanceStateOverride({
        owner,
        spender,
        token: { ...token, extensions: { allowanceSlot: 10 } },
      }),
    ).toEqual([
      {
        address: token.address,
        stateDiff: [
          {
            slot: '0x7f551955c74648d65f1a61a5d03d098f1a2823a6e5d5c4d31635a9eaf5e79eb9',
            value: toHex(maxUint256, { size: 32 }),
          },
        ],
      },
    ])
  })
})
