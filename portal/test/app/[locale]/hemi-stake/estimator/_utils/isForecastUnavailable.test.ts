import { isForecastUnavailable } from 'app/[locale]/hemi-stake/estimator/_utils/isForecastUnavailable'
import { describe, expect, it } from 'vitest'

const settled = {
  hasForecast: true,
  isError: false,
  isLoading: false,
  needsWallet: false,
}

describe('isForecastUnavailable', function () {
  it('should show the forecast once everything settled', function () {
    expect(isForecastUnavailable(settled)).toBe(false)
  })

  it('should let an error win over a query still loading', function () {
    expect(
      isForecastUnavailable({ ...settled, isError: true, isLoading: true }),
    ).toBe(true)
  })

  it('should wait for loading before calling a missing forecast unavailable', function () {
    expect(
      isForecastUnavailable({
        ...settled,
        hasForecast: false,
        isLoading: true,
      }),
    ).toBe(false)
  })

  it('should report a missing forecast once loading is done', function () {
    expect(isForecastUnavailable({ ...settled, hasForecast: false })).toBe(true)
  })

  it('should wait for loading before asking for a wallet', function () {
    expect(
      isForecastUnavailable({ ...settled, isLoading: true, needsWallet: true }),
    ).toBe(false)
  })

  it('should ask for a wallet once loading is done', function () {
    expect(isForecastUnavailable({ ...settled, needsWallet: true })).toBe(true)
  })
})
