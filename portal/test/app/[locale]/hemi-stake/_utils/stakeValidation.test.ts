import {
  minDays,
  twoYears,
} from 'app/[locale]/hemi-stake/_utils/lockCreationTimes'
import { getStakeValidation } from 'app/[locale]/hemi-stake/_utils/stakeValidation'
import { type Token } from 'types/token'
import { parseUnits } from 'viem'
import { describe, expect, it, vi } from 'vitest'

vi.mock('utils/chainClients', () => ({
  getPublicClient: vi.fn(),
}))

const token: Token = {
  address: '0x99e3dE3817F6081B2568208337ef83295b7f591D',
  chainId: 43111,
  decimals: 18,
  name: 'Hemi',
  symbol: 'HEMI',
}

const t = ((key: string) => key) as Parameters<
  typeof getStakeValidation
>[0]['t']

const loaded = (data: bigint) => ({ data, isError: false, isPending: false })

const aStake = {
  balance: loaded(parseUnits('100000', 18)),
  input: '10000',
  lockupDays: twoYears,
  t,
  token,
}

describe('getStakeValidation', function () {
  it('lets a stake within the balance and on a valid lockup through', function () {
    expect(getStakeValidation(aStake)).toEqual({
      canStake: true,
      errorKey: undefined,
      validationError: undefined,
    })
  })

  it('blocks a stake above the balance and says why', function () {
    const { canStake, validationError } = getStakeValidation({
      ...aStake,
      balance: loaded(parseUnits('5000', 18)),
    })

    expect(canStake).toBe(false)
    expect(validationError).toBe('common.insufficient-balance')
  })

  it('blocks an invalid lockup with the lockup reason', function () {
    const { canStake, validationError } = getStakeValidation({
      ...aStake,
      lockupDays: minDays - 1,
    })

    expect(canStake).toBe(false)
    expect(validationError).toBe('hemi-stake.form.min-days')
  })

  it('names no reason while the balance is still loading', function () {
    const { canStake, validationError } = getStakeValidation({
      ...aStake,
      balance: { data: undefined, isError: false, isPending: true },
    })

    expect(canStake).toBe(false)
    expect(validationError).toBeUndefined()
  })

  it('does not block the stake when the balance read failed', function () {
    const { canStake, validationError } = getStakeValidation({
      ...aStake,
      balance: { data: undefined, isError: true, isPending: false },
    })

    expect(canStake).toBe(true)
    expect(validationError).toBeUndefined()
  })
})
