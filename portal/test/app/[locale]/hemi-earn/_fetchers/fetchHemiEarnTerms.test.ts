import { fetchHemiEarnTerms } from 'app/[locale]/hemi-earn/_fetchers/fetchHemiEarnTerms'
import fetch from 'fetch-plus-plus'
import { describe, expect, it, vi } from 'vitest'

vi.mock('fetch-plus-plus', () => ({ default: vi.fn() }))

const apiUrl = 'https://vetro.test'

const terms = {
  domain: { chainId: 43111, name: 'Vetro Terms Acceptance', version: '1' },
  primaryType: 'TermsAcceptance',
  statement: 'I agree to the Vetro Terms of Use.',
  termsHash:
    '0x0e1cfd435e0ecf5efcf7060aac708caa4e2d3b656f319b049476e55dbdd253cb',
  termsUrl: 'https://vetro.org/terms-of-use',
  termsVersion: 'mock-1',
  types: {
    TermsAcceptance: [
      { name: 'statement', type: 'string' },
      { name: 'termsUrl', type: 'string' },
      { name: 'termsHash', type: 'bytes32' },
      { name: 'termsVersion', type: 'string' },
      { name: 'account', type: 'address' },
      { name: 'issuedAt', type: 'uint256' },
    ],
  },
}

describe('fetchHemiEarnTerms', function () {
  it('asks the Vetro API for the current terms', async function () {
    vi.mocked(fetch).mockResolvedValue(terms)

    await fetchHemiEarnTerms(apiUrl)

    expect(fetch).toHaveBeenCalledWith('https://vetro.test/hemi-earn/terms', {
      cache: 'no-store',
      method: 'GET',
    })
  })

  it('returns everything needed to sign the acceptance', async function () {
    vi.mocked(fetch).mockResolvedValue(terms)

    expect(await fetchHemiEarnTerms(apiUrl)).toEqual(terms)
  })

  it('keeps the field order the API declares for the signed message', async function () {
    vi.mocked(fetch).mockResolvedValue(terms)

    const { types } = await fetchHemiEarnTerms(apiUrl)

    expect(types.TermsAcceptance.map(field => field.name)).toEqual([
      'statement',
      'termsUrl',
      'termsHash',
      'termsVersion',
      'account',
      'issuedAt',
    ])
  })

  it('rejects when the API fails', async function () {
    vi.mocked(fetch).mockRejectedValue(new Error('Internal Server Error'))

    await expect(fetchHemiEarnTerms(apiUrl)).rejects.toThrow(
      'Internal Server Error',
    )
  })

  it('rejects when the response has no version', async function () {
    vi.mocked(fetch).mockResolvedValue({ ...terms, termsVersion: undefined })

    await expect(fetchHemiEarnTerms(apiUrl)).rejects.toThrow(
      'Hemi Earn terms response is missing termsVersion',
    )
  })
})
