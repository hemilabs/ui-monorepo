import { getAmountPresets } from 'app/[locale]/hemi-stake/_utils/amountPresets'
import { parseUnits } from 'viem'
import { describe, expect, it } from 'vitest'

const hemi = (amount: string) => parseUnits(amount, 18)

const presetsFor = (balance: bigint | undefined, locale = 'en') =>
  getAmountPresets({ balance, decimals: 18, locale })

describe('getAmountPresets', function () {
  it('labels the fixed presets with their compact notation', function () {
    expect(presetsFor(undefined).presets).toEqual([
      { label: '1K', value: '1000' },
      { label: '10K', value: '10000' },
      { label: '100K', value: '100000' },
      { label: '1M', value: '1000000' },
    ])
  })

  it('compacts the labels for the given locale', function () {
    // Intl separates the compact suffix with a non-breaking space
    const nbsp = '\u00a0'
    expect(
      presetsFor(undefined, 'es').presets.map(({ label }) => label),
    ).toEqual([`1${nbsp}mil`, `10${nbsp}mil`, `100${nbsp}mil`, `1${nbsp}M`])
    expect(presetsFor(hemi('248500'), 'pt').walletPreset?.label).toBe(
      `248,5${nbsp}mil`,
    )
  })

  it('has no wallet preset when the balance is unknown', function () {
    expect(presetsFor(undefined).walletPreset).toBeUndefined()
  })

  it('has no wallet preset when the balance is zero', function () {
    expect(presetsFor(BigInt(0)).walletPreset).toBeUndefined()
  })

  it('compacts the wallet balance into its label', function () {
    expect(presetsFor(hemi('248500')).walletPreset).toEqual({
      label: '248.5K',
      value: '248500',
    })
  })

  it('keeps the full precision of the balance in the value', function () {
    const { walletPreset } = presetsFor(hemi('1234.567891'))
    expect(walletPreset?.label).toBe('1.23K')
    expect(walletPreset?.value).toBe('1234.567891')
  })

  it('drops the wallet preset when it duplicates a fixed one', function () {
    expect(presetsFor(hemi('10000')).walletPreset).toBeUndefined()
  })

  it('drops a dust balance that would compact to a label of zero', function () {
    expect(presetsFor(BigInt(1)).walletPreset).toBeUndefined()
    expect(presetsFor(hemi('0.004')).walletPreset).toBeUndefined()
  })

  it('keeps a balance that still compacts to something readable', function () {
    expect(presetsFor(hemi('0.01')).walletPreset).toEqual({
      label: '0.01',
      value: '0.01',
    })
  })

  it('reads the balance with the decimals it is given', function () {
    expect(
      getAmountPresets({
        balance: parseUnits('42', 6),
        decimals: 6,
        locale: 'en',
      }).walletPreset,
    ).toEqual({ label: '42', value: '42' })
  })

  it('leaves the fixed presets untouched when a wallet balance is added', function () {
    expect(presetsFor(hemi('248500')).presets).toEqual(
      presetsFor(undefined).presets,
    )
  })
})
