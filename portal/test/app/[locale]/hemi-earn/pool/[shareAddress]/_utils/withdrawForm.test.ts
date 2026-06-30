import { type EvmToken } from 'types/token'
import { describe, expect, it, vi } from 'vitest'

import {
  applyWithdrawSharesGuard,
  computeWithdrawSubmitLoading,
  deriveWithdrawShares,
  getTypedAssetAmount,
  getWithdrawValidationTarget,
  resolveRoundToZeroIssue,
  resolveWithdrawInputValues,
} from '../../../../../../../app/[locale]/hemi-earn/pool/[shareAddress]/_utils/withdrawForm'

// `parseTokenUnits` transitively imports `utils/chainClients`, whose
// `eth-rpc-cache` dependency fails to resolve under vitest. Stub it — these
// pure helpers never touch a client at runtime.
vi.mock('utils/chainClients', () => ({
  getEvmL1PublicClient: vi.fn(),
  getPublicClient: vi.fn(),
}))

const shareToken = {
  address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  chainId: 1,
  decimals: 8,
  symbol: 'svetBTC',
} as EvmToken

const assetToken = {
  address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  chainId: 1,
  decimals: 8,
  symbol: 'hemiBTC',
} as EvmToken

describe('getTypedAssetAmount', function () {
  it('parses the input in tokens-mode', function () {
    expect(
      getTypedAssetAmount({
        input: '1',
        isTokensMode: true,
        token: assetToken,
      }),
    ).toBe(BigInt(100000000))
  })

  it('returns 0n in shares-mode', function () {
    expect(
      getTypedAssetAmount({
        input: '1',
        isTokensMode: false,
        token: assetToken,
      }),
    ).toBe(BigInt(0))
  })
})

describe('deriveWithdrawShares', function () {
  it('uses the converted shares in tokens-mode', function () {
    expect(
      deriveWithdrawShares({
        assetShares: BigInt(42),
        input: '1',
        isTokensMode: true,
        shareToken,
      }),
    ).toBe(BigInt(42))
  })

  it('falls back to 0n while the conversion is pending', function () {
    expect(
      deriveWithdrawShares({
        assetShares: undefined,
        input: '1',
        isTokensMode: true,
        shareToken,
      }),
    ).toBe(BigInt(0))
  })

  it('parses the input as shares in shares-mode', function () {
    expect(
      deriveWithdrawShares({
        assetShares: undefined,
        input: '0.5',
        isTokensMode: false,
        shareToken,
      }),
    ).toBe(BigInt(50000000))
  })
})

describe('resolveWithdrawInputValues', function () {
  it('shows the literal shares input and derives the asset value', function () {
    expect(
      resolveWithdrawInputValues({
        assetOut: BigInt(12300000),
        assetToken,
        input: '0.5',
        isTokensMode: false,
        shares: BigInt(50000000),
        shareToken,
      }),
    ).toEqual({ assetValue: '0.123', sharesValue: '0.5' })
  })

  it('shows the literal asset input and derives the shares value', function () {
    expect(
      resolveWithdrawInputValues({
        assetOut: BigInt(0),
        assetToken,
        input: '2',
        isTokensMode: true,
        shares: BigInt(50000000),
        shareToken,
      }),
    ).toEqual({ assetValue: '2', sharesValue: '0.5' })
  })
})

describe('computeWithdrawSubmitLoading', function () {
  const base = {
    balanceLoaded: true,
    isAllowanceLoading: false,
    isAssetsToSharesLoading: false,
    isPreviewLoading: false,
    isTokensMode: false,
    validInput: true,
  }

  it('is false when nothing is pending', function () {
    expect(computeWithdrawSubmitLoading(base)).toBe(false)
  })

  it('is true while the balance is loading', function () {
    expect(
      computeWithdrawSubmitLoading({ ...base, balanceLoaded: false }),
    ).toBe(true)
  })

  it('is true in tokens-mode while shares are still being derived', function () {
    expect(
      computeWithdrawSubmitLoading({
        ...base,
        isAssetsToSharesLoading: true,
        isTokensMode: true,
      }),
    ).toBe(true)
  })

  it('ignores the shares-derivation flag in shares-mode', function () {
    expect(
      computeWithdrawSubmitLoading({
        ...base,
        isAssetsToSharesLoading: true,
        isTokensMode: false,
      }),
    ).toBe(false)
  })
})

describe('getWithdrawValidationTarget', function () {
  const base = {
    assetToken,
    maxAssetOut: BigInt(7),
    shareBalance: BigInt(3),
    shareToken,
  }

  it('targets the asset in tokens-mode', function () {
    expect(
      getWithdrawValidationTarget({ ...base, isTokensMode: true }),
    ).toEqual({ balance: BigInt(7), token: assetToken })
  })

  it('targets the share token otherwise', function () {
    expect(
      getWithdrawValidationTarget({ ...base, isTokensMode: false }),
    ).toEqual({ balance: BigInt(3), token: shareToken })
  })
})

describe('applyWithdrawSharesGuard', function () {
  const base = {
    baseError: undefined,
    baseErrorKey: undefined,
    baseValid: true,
    insufficientBalanceError: 'insufficient',
    isTokensMode: true,
    shareBalance: BigInt(1000),
    shares: BigInt(500),
    shareValueLoaded: true,
  }

  it('keeps a valid result untouched', function () {
    expect(applyWithdrawSharesGuard(base)).toEqual({
      errorKey: undefined,
      validationError: undefined,
      validInput: true,
    })
  })

  it('blocks when derived shares exceed the balance even if the base is valid', function () {
    expect(applyWithdrawSharesGuard({ ...base, shares: BigInt(1001) })).toEqual(
      {
        errorKey: 'insufficient-balance',
        validationError: 'insufficient',
        validInput: false,
      },
    )
  })

  it('does not apply the guard in shares-mode (base validation owns it)', function () {
    expect(
      applyWithdrawSharesGuard({
        ...base,
        isTokensMode: false,
        shares: BigInt(1001),
      }),
    ).toEqual({
      errorKey: undefined,
      validationError: undefined,
      validInput: true,
    })
  })

  it('does not apply the guard before the share balance has loaded', function () {
    expect(
      applyWithdrawSharesGuard({
        ...base,
        shares: BigInt(1001),
        shareValueLoaded: false,
      }),
    ).toEqual({
      errorKey: undefined,
      validationError: undefined,
      validInput: true,
    })
  })

  it('passes the base error through when within balance', function () {
    expect(
      applyWithdrawSharesGuard({
        ...base,
        baseError: 'Enter an amount',
        baseErrorKey: 'enter-an-amount',
        baseValid: false,
      }),
    ).toEqual({
      errorKey: 'enter-an-amount',
      validationError: 'Enter an amount',
      validInput: false,
    })
  })
})

describe('resolveRoundToZeroIssue', function () {
  const base = {
    isAssetsToSharesLoading: false,
    isTokensMode: true,
    shares: BigInt(0),
    validInput: true,
  }

  it('flags a valid tokens-mode amount that converts to 0 shares', function () {
    expect(resolveRoundToZeroIssue(base)).toBe('amount-too-small')
  })

  it('returns undefined in shares-mode', function () {
    expect(
      resolveRoundToZeroIssue({ ...base, isTokensMode: false }),
    ).toBeUndefined()
  })

  it('returns undefined while the conversion is still loading', function () {
    expect(
      resolveRoundToZeroIssue({ ...base, isAssetsToSharesLoading: true }),
    ).toBeUndefined()
  })

  it('returns undefined once shares are non-zero', function () {
    expect(
      resolveRoundToZeroIssue({ ...base, shares: BigInt(1) }),
    ).toBeUndefined()
  })
})
