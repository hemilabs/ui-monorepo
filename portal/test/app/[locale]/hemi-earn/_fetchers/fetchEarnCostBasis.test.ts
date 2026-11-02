import { fetchEarnCostBasis } from 'app/[locale]/hemi-earn/_fetchers/fetchEarnCostBasis'
import fetch from 'fetch-plus-plus'
import { type Address } from 'viem'
import { describe, expect, it, vi } from 'vitest'

vi.mock('fetch-plus-plus', () => ({ default: vi.fn() }))

const account = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed' as Address
const apiUrl = 'https://vetro.test'
const checksummedShare = '0xfC1B3A3a1B4C4B0CEd0e40F9dDC4D43E5e4F0AbC'

describe('fetchEarnCostBasis', function () {
  it('asks the Vetro API for the account cost basis', async function () {
    vi.mocked(fetch).mockResolvedValue({ costBasis: {} })

    await fetchEarnCostBasis({ account, apiUrl })

    expect(fetch).toHaveBeenCalledWith(
      `https://vetro.test/hemi-earn/cost-basis/${account}`,
      { cache: 'no-store', method: 'GET' },
    )
  })

  it('keeps the checksummed share address the API keys by', async function () {
    vi.mocked(fetch).mockResolvedValue({
      costBasis: { [checksummedShare]: '1010000000000000000' },
    })

    expect(await fetchEarnCostBasis({ account, apiUrl })).toEqual({
      [checksummedShare]: '1010000000000000000',
    })
  })

  it('keeps the fractional value untouched', async function () {
    vi.mocked(fetch).mockResolvedValue({
      costBasis: { [checksummedShare]: '0.5' },
    })

    expect(await fetchEarnCostBasis({ account, apiUrl })).toEqual({
      [checksummedShare]: '0.5',
    })
  })

  it('returns an empty record when the account holds nothing', async function () {
    vi.mocked(fetch).mockResolvedValue({ costBasis: {} })

    expect(await fetchEarnCostBasis({ account, apiUrl })).toEqual({})
  })

  it('rejects when the API fails', async function () {
    vi.mocked(fetch).mockRejectedValue(new Error('Internal Server Error'))

    await expect(fetchEarnCostBasis({ account, apiUrl })).rejects.toThrow(
      'Internal Server Error',
    )
  })

  it('rejects when the response has no cost basis', async function () {
    vi.mocked(fetch).mockResolvedValue({})

    await expect(fetchEarnCostBasis({ account, apiUrl })).rejects.toThrow(
      'Hemi Earn cost basis response is missing costBasis',
    )
  })
})
