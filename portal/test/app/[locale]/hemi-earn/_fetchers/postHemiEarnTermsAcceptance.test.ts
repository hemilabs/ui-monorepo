import { postHemiEarnTermsAcceptance } from 'app/[locale]/hemi-earn/_fetchers/postHemiEarnTermsAcceptance'
import fetch from 'fetch-plus-plus'
import { type Address, type Hex } from 'viem'
import { describe, expect, it, vi } from 'vitest'

vi.mock('fetch-plus-plus', () => ({ default: vi.fn() }))

const account = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed' as Address
const apiUrl = 'https://vetro.test'
const issuedAt = 1798000000
const signature = '0xdeadbeef' as Hex
const termsVersion = 'mock-1'

const acceptance = { account, apiUrl, issuedAt, signature, termsVersion }

const httpError = (status: number) =>
  Object.assign(new Error(`HTTP ${status}`), { status })

describe('postHemiEarnTermsAcceptance', function () {
  it('posts the signed acceptance to the Vetro API', async function () {
    vi.mocked(fetch).mockResolvedValue({ acceptedVersion: termsVersion })

    await postHemiEarnTermsAcceptance(acceptance)

    expect(fetch).toHaveBeenCalledWith(
      'https://vetro.test/hemi-earn/terms/acceptance',
      {
        body: JSON.stringify({ account, issuedAt, signature, termsVersion }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      },
    )
  })

  it('returns the version the API recorded', async function () {
    vi.mocked(fetch).mockResolvedValue({ acceptedVersion: termsVersion })

    expect(await postHemiEarnTermsAcceptance(acceptance)).toBe(termsVersion)
  })

  it.each([401, 409, 413, 422, 500])(
    'rejects with the %i the API answered, so the caller can tell them apart',
    async function (status) {
      vi.mocked(fetch).mockRejectedValue(httpError(status))

      await expect(postHemiEarnTermsAcceptance(acceptance)).rejects.toThrow(
        `HTTP ${status}`,
      )
    },
  )

  it('rejects when the response has no accepted version', async function () {
    vi.mocked(fetch).mockResolvedValue({})

    await expect(postHemiEarnTermsAcceptance(acceptance)).rejects.toThrow(
      'Hemi Earn terms acceptance response is missing acceptedVersion',
    )
  })
})
