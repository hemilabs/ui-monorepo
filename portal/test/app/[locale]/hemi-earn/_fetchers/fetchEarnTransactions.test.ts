import { fetchEarnTransactions } from 'app/[locale]/hemi-earn/_fetchers/fetchEarnTransactions'
import fetch from 'fetch-plus-plus'
import { type Address } from 'viem'
import { describe, expect, it, vi } from 'vitest'

vi.mock('fetch-plus-plus', () => ({ default: vi.fn() }))

const account = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed' as Address
const apiUrl = 'https://vetro.test'

describe('fetchEarnTransactions', function () {
  it('asks the Vetro API for the account requests', async function () {
    vi.mocked(fetch).mockResolvedValue({ requests: [] })

    await fetchEarnTransactions({ account, apiUrl })

    expect(fetch).toHaveBeenCalledWith(
      `https://vetro.test/hemi-earn/requests/${account}`,
      { method: 'GET' },
    )
  })

  it('unwraps the requests from the response', async function () {
    const requests = [{ requestId: '1' }, { requestId: '2' }]
    vi.mocked(fetch).mockResolvedValue({ requests })

    expect(await fetchEarnTransactions({ account, apiUrl })).toEqual(requests)
  })

  it('rejects when the API fails', async function () {
    vi.mocked(fetch).mockRejectedValue(new Error('Internal Server Error'))

    await expect(fetchEarnTransactions({ account, apiUrl })).rejects.toThrow(
      'Internal Server Error',
    )
  })

  it('rejects when the response has no requests', async function () {
    vi.mocked(fetch).mockResolvedValue({})

    await expect(fetchEarnTransactions({ account, apiUrl })).rejects.toThrow(
      'Hemi Earn requests response is missing requests',
    )
  })
})
