import { describe, expect, it, vi } from 'vitest'

import {
  completedCopy,
  completedSubheading,
} from '../../../../../app/[locale]/hemi-earn/_utils/successCopy'

const t = vi.fn((key, values) =>
  values ? `${key}:${values.vaultName}:${values.operator}` : key,
)

describe('completedCopy', function () {
  it('names the vault and its operator for a deposit', function () {
    expect(
      completedCopy({
        kind: 'DEPOSIT',
        operator: 'Vetro Service & Support Corp.',
        t,
        vaultName: 'sVUSD',
      }),
    ).toBe('deposit-complete:sVUSD:Vetro Service & Support Corp.')
  })

  it('drops to the short form rather than a sentence with holes', function () {
    expect(
      completedCopy({
        kind: 'DEPOSIT',
        operator: undefined,
        t,
        vaultName: 'sVUSD',
      }),
    ).toBe('deposit-complete-plain')
    expect(
      completedCopy({
        kind: 'DEPOSIT',
        operator: 'Vetro Service & Support Corp.',
        t,
        vaultName: undefined,
      }),
    ).toBe('deposit-complete-plain')
  })

  it('needs no vault data for a withdrawal', function () {
    expect(
      completedCopy({
        kind: 'REDEEM',
        operator: undefined,
        t,
        vaultName: undefined,
      }),
    ).toBe('withdraw-complete')
  })
})

describe('completedSubheading', function () {
  const base = {
    fallback: 'review-your-deposit',
    kind: 'DEPOSIT' as const,
    operator: 'Vetro Service & Support Corp.',
    t,
    vaultName: 'sVUSD',
  }

  it('reads the completed sentence once the request is finalized', function () {
    expect(completedSubheading({ ...base, isCompleted: true })).toBe(
      'deposit-complete:sVUSD:Vetro Service & Support Corp.',
    )
  })

  it('keeps the generic subheading while the request is in flight', function () {
    expect(completedSubheading({ ...base, isCompleted: false })).toBe(
      'review-your-deposit',
    )
  })

  it('reads the short form when the vault is unknown', function () {
    expect(
      completedSubheading({
        ...base,
        isCompleted: true,
        operator: undefined,
        vaultName: undefined,
      }),
    ).toBe('deposit-complete-plain')
  })
})
