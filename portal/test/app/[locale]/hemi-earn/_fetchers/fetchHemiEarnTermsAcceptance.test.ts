import { fetchHemiEarnTermsAcceptance } from 'app/[locale]/hemi-earn/_fetchers/fetchHemiEarnTermsAcceptance'
import fetch from 'fetch-plus-plus'
import { type Address } from 'viem'
import { describe, expect, it, vi } from 'vitest'

vi.mock('fetch-plus-plus', () => ({ default: vi.fn() }))

const account = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed' as Address
const apiUrl = 'https://vetro.test'

const httpError = (status: number) =>
  Object.assign(new Error(`HTTP ${status}`), { status })

describe('fetchHemiEarnTermsAcceptance', function () {
  it('asks the Vetro API for the version the account accepted', async function () {
    vi.mocked(fetch).mockResolvedValue({ acceptedVersion: 'mock-1' })

    await fetchHemiEarnTermsAcceptance({ account, apiUrl })

    expect(fetch).toHaveBeenCalledWith(
      `https://vetro.test/hemi-earn/terms/acceptance/${account}`,
      { cache: 'no-store', method: 'GET' },
    )
  })

  it('returns the accepted version', async function () {
    vi.mocked(fetch).mockResolvedValue({ acceptedVersion: 'mock-1' })

    expect(await fetchHemiEarnTermsAcceptance({ account, apiUrl })).toBe(
      'mock-1',
    )
  })

  it('reads a 404 as a wallet that never accepted', async function () {
    vi.mocked(fetch).mockRejectedValue(httpError(404))

    expect(await fetchHemiEarnTermsAcceptance({ account, apiUrl })).toBeNull()
  })

  it('rejects when the API fails for any other reason', async function () {
    vi.mocked(fetch).mockRejectedValue(httpError(500))

    await expect(
      fetchHemiEarnTermsAcceptance({ account, apiUrl }),
    ).rejects.toThrow('HTTP 500')
  })

  it('rejects when the response has no accepted version', async function () {
    vi.mocked(fetch).mockResolvedValue({})

    await expect(
      fetchHemiEarnTermsAcceptance({ account, apiUrl }),
    ).rejects.toThrow(
      'Hemi Earn terms acceptance response is missing acceptedVersion',
    )
  })
})
